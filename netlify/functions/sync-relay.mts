import { createHash, timingSafeEqual } from "node:crypto";
import type { Config, Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";

type RelayRecord = {
  id: string;
  at: number;
  from: string;
  sealed: string;
};

type RelayMessage = RelayRecord & { cursor: string };

const MAX_BODY_BYTES = 131_072;
const MAX_SEALED_CHARS = 120_000;
const MAX_BATCH = 30;
const TTL_MS = 20 * 60 * 1000;

function relayStore() {
  if (Netlify.context?.deploy?.context === "production") {
    return getStore("omnios-sync-relay", { consistency: "strong" });
  }
  return getDeployStore("omnios-sync-relay");
}

function safeToken(value: unknown, max = 96) {
  const token = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, max);
  if (!token) throw new Error("Missing relay token");
  return token;
}

function safeCursor(value: unknown) {
  const cursor = String(value || "");
  if (!cursor) return "";
  if (!/^message\/[A-Za-z0-9_-]+\/\d{13}-[A-Za-z0-9_-]+$/.test(cursor)) throw new Error("Invalid relay cursor");
  return cursor;
}

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "https://omnios-pwa.netlify.app";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store, max-age=0"
  };
}

function json(req: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8" }
  });
}

export default async (req: Request, _context: Context) => {
  const origin = req.headers.get("origin");
  if (origin && !["https://omnios-pwa.netlify.app", "https://mohamedaminekilani-cyber.github.io"].includes(origin) && origin !== new URL(req.url).origin) return new Response("Forbidden origin", {status:403});
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!/^[a-f0-9]{64}$/.test(token)) return json(req, {ok:false,error:"Pair again with the latest app"}, 401);
  const authorizedChannel = createHash("sha256").update(token).digest("hex").slice(0,48);
  const authorize = (channel: string) => {if(channel.length!==authorizedChannel.length || !timingSafeEqual(Buffer.from(channel),Buffer.from(authorizedChannel))) throw Error("Invalid relay capability");};
  const store = relayStore();

  try {
    if (req.method === "POST") {
      const declaredLength = Number(req.headers.get("content-length") || 0);
      if (declaredLength > MAX_BODY_BYTES) return json(req, { ok: false, error: "Payload Too Large" }, 413);

      const raw = await req.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json(req, { ok: false, error: "Payload Too Large" }, 413);
      const body = JSON.parse(raw);
      const channel = safeToken(body?.channel, 80);authorize(channel);
      const id = safeToken(body?.id, 64);
      const from = safeToken(body?.from || "device", 96);
      const sealed = String(body?.sealed || "");
      if (!sealed || sealed.length > MAX_SEALED_CHARS) throw new Error("Invalid relay payload");

      const at = Date.now();
      const key = `message/${channel}/${String(at).padStart(13, "0")}-${id}`;
      const record: RelayRecord = { id, at, from, sealed };
      await store.setJSON(key, record);
      return json(req, { ok: true, id, at, cursor: key }, 201);
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const channel = safeToken(url.searchParams.get("channel"), 80);authorize(channel);
      const cursor = safeCursor(url.searchParams.get("cursor"));
      const prefix = `message/${channel}/`;
      if (cursor && !cursor.startsWith(prefix)) throw new Error("Cursor does not belong to channel");

      const listed = await store.list({ prefix });
      const now = Date.now();
      const cutoff = now - TTL_MS;

      const candidates = listed.blobs
        .map((x) => {
          const tail = x.key.slice(prefix.length);
          const at = Number(tail.slice(0, 13)) || 0;
          return { key: x.key, at };
        })
        .filter((x) => x.at >= cutoff && (!cursor || x.key > cursor))
        .sort((a, b) => a.key.localeCompare(b.key))
        .slice(0, MAX_BATCH);

      const messages: RelayMessage[] = [];
      for (const item of candidates) {
        const row = await store.get(item.key, { type: "json" }) as RelayRecord | null;
        if (row) messages.push({ ...row, cursor: item.key });
      }

      const stale = listed.blobs
        .map((x) => ({ key: x.key, at: Number(x.key.slice(prefix.length, prefix.length + 13)) || 0 }))
        .filter((x) => x.at && x.at < cutoff)
        .slice(0, 40);
      if (stale.length) await Promise.allSettled(stale.map((x) => store.delete(x.key)));

      return json(req, { ok: true, messages, serverAt: now, cursor: messages.at(-1)?.cursor || cursor });
    }

    return json(req, { ok: false, error: "Method Not Allowed" }, 405);
  } catch (error: any) {
    console.error("Second Brain sync relay", error);
    return json(req, { ok: false, error: error?.message || "Relay error", messages: [] }, 400);
  }
};

export const config: Config = {
  path: "/api/sync/relay"
};
