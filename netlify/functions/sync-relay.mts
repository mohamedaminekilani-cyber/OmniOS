import type { Config, Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";

type RelayRecord = { id: string; at: number; from: string; sealed: string };
type RelaySession = { auth: string; createdAt: number; expiresAt: number; count: number };

const SESSION_TTL = 20 * 60 * 1000;
const MAX_MESSAGES = 180;
const MAX_BODY = 2_000_000;

function relayStore() {
  if (Netlify.context?.deploy?.context === "production") return getStore("omnios-sync-relay", { consistency: "strong" });
  return getDeployStore("omnios-sync-relay");
}
function safeToken(value: unknown, max = 96) {
  const token = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, max);
  if (!token) throw new Error("Missing relay token");
  return token;
}
function safeCursor(value: unknown) {
  return String(value || "").replace(/[^0-9a-zA-Z_-]/g, "").slice(0, 160);
}
function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = origin === "https://mohamedaminekilani-cyber.github.io" || origin === "https://omnios-pwa.netlify.app" || new URL(req.url).origin === origin;
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://mohamedaminekilani-cyber.github.io",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Omni-Relay-Auth",
    "Vary": "Origin",
    "Cache-Control": "no-store, max-age=0"
  };
}
async function authorize(store: ReturnType<typeof relayStore>, channel: string, auth: string) {
  const key = "session/" + channel;
  const now = Date.now();
  const existing = await store.get(key, { type: "json" }) as RelaySession | null;
  if (existing && existing.expiresAt > now) {
    if (existing.auth !== auth) throw new Error("Relay authorization failed");
    return existing;
  }
  const fresh: RelaySession = { auth, createdAt: now, expiresAt: now + SESSION_TTL, count: 0 };
  await store.setJSON(key, fresh);
  return fresh;
}
async function saveSession(store: ReturnType<typeof relayStore>, channel: string, session: RelaySession) {
  session.expiresAt = Date.now() + SESSION_TTL;
  await store.setJSON("session/" + channel, session);
}

export default async (req: Request, _context: Context) => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  const store = relayStore();
  try {
    const url = new URL(req.url);
    if (req.method === "POST") {
      const text = await req.text();
      if (new TextEncoder().encode(text).byteLength > MAX_BODY) return Response.json({ ok: false, error: "Payload too large" }, { status: 413, headers });
      const body = JSON.parse(text);
      const channel = safeToken(body?.channel, 80);
      const auth = safeToken(req.headers.get("x-omni-relay-auth") || body?.auth, 96);
      const session = await authorize(store, channel, auth);
      if (session.count >= MAX_MESSAGES) return Response.json({ ok: false, error: "Relay session quota reached" }, { status: 429, headers });
      const id = safeToken(body?.id, 64), from = safeToken(body?.from || "device", 96), sealed = String(body?.sealed || "");
      if (!sealed || sealed.length > 1_800_000) throw new Error("Invalid relay payload");
      const at = Date.now();
      const cursor = String(at).padStart(13, "0") + "-" + id;
      const record: RelayRecord = { id, at, from, sealed };
      await store.setJSON("message/" + channel + "/" + cursor, record);
      session.count += 1;
      await saveSession(store, channel, session);
      return Response.json({ ok: true, id, cursor, serverAt: at }, { status: 201, headers });
    }
    if (req.method === "GET") {
      const channel = safeToken(url.searchParams.get("channel"), 80);
      const auth = safeToken(req.headers.get("x-omni-relay-auth") || url.searchParams.get("auth"), 96);
      const cursor = safeCursor(url.searchParams.get("cursor"));
      const session = await authorize(store, channel, auth);
      const prefix = "message/" + channel + "/", listed = await store.list({ prefix }), now = Date.now(), cutoff = now - SESSION_TTL;
      const candidates = listed.blobs
        .map(x => ({ key: x.key, tail: x.key.slice(prefix.length), at: Number(x.key.slice(prefix.length, prefix.length + 13)) || 0 }))
        .filter(x => !cursor || x.tail > cursor)
        .sort((a,b) => a.tail.localeCompare(b.tail))
        .slice(0, 50);
      const messages: RelayRecord[] = [];
      let nextCursor = cursor;
      for (const item of candidates) {
        const row = await store.get(item.key, { type: "json" }) as RelayRecord | null;
        if (row) { messages.push(row); nextCursor = item.tail; }
      }
      const stale = listed.blobs
        .map(x => ({ key: x.key, at: Number(x.key.slice(prefix.length, prefix.length + 13)) || 0 }))
        .filter(x => x.at && x.at < cutoff)
        .slice(0, 50);
      if (stale.length) await Promise.allSettled(stale.map(x => store.delete(x.key)));
      await saveSession(store, channel, session);
      return Response.json({ ok: true, messages, cursor: nextCursor, serverAt: now }, { headers });
    }
    return new Response("Method Not Allowed", { status: 405, headers });
  } catch (error: any) {
    console.error("Second Brain sync relay", error);
    return Response.json({ ok: false, error: error?.message || "Relay error", messages: [] }, { status: 400, headers });
  }
};

export const config: Config = { path: "/api/sync/relay" };
