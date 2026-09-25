import type { Config, Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";
import webpush from "web-push";

type ScheduleItem = { id: string; fireAt: string; title: string; body?: string; view?: string; tag?: string };
type DeviceRecord = {
  deviceId: string;
  ownerHash: string;
  subscription?: any;
  timezone?: string;
  schedules?: ScheduleItem[];
  sent?: Record<string,string>;
  updatedAt?: string;
};

function pushStore() {
  if (Netlify.context?.deploy?.context === "production") return getStore("omnios-push", { consistency: "strong" });
  return getDeployStore("omnios-push");
}
function safeId(value: unknown) {
  const id = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
  if (!id) throw new Error("Missing device id");
  return id;
}
function secretHash(value: unknown) {
  const secret = String(value || "");
  if (secret.length < 32 || secret.length > 256) throw new Error("Missing device ownership secret");
  return createHash("sha256").update(secret).digest("hex");
}
function sameHash(a: string, b: string) {
  const aa = Buffer.from(a || "", "hex"), bb = Buffer.from(b || "", "hex");
  return aa.length === bb.length && aa.length > 0 && timingSafeEqual(aa, bb);
}
function allowedOrigin(req: Request) {
  const origin = req.headers.get("origin") || "";
  if (!origin) return "";
  try {
    const source = new URL(origin), target = new URL(req.url);
    if (source.origin === target.origin) return origin;
    if (source.origin === "https://mohamedaminekilani-cyber.github.io") return origin;
    if (source.origin === "https://omnios-pwa.netlify.app") return origin;
  } catch {}
  return "";
}
function corsHeaders(req: Request) {
  const origin = allowedOrigin(req);
  return {
    "Access-Control-Allow-Origin": origin || "https://mohamedaminekilani-cyber.github.io",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}
function configureWebPush() {
  const publicKey = Netlify.env.get("VAPID_PUBLIC_KEY") || "", privateKey = Netlify.env.get("VAPID_PRIVATE_KEY") || "";
  const subject = Netlify.env.get("VAPID_SUBJECT") || "https://omnios-pwa.netlify.app";
  if (!publicKey || !privateKey) throw new Error("Push server keys are not configured");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}
async function sendTest(subscription: any) {
  configureWebPush();
  await webpush.sendNotification(subscription, JSON.stringify({
    title: "Second Brain notifications are ready",
    body: "This is a verified test push from your installed Second Brain app.",
    view: "reminders",
    tag: "secondbrain-push-test"
  }), { TTL: 300 });
}

export default async (req: Request, _context: Context) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers });
  if (!allowedOrigin(req)) return Response.json({ ok: false, error: "Forbidden origin" }, { status: 403, headers });
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).byteLength > 1_000_000) return Response.json({ ok:false,error:"Payload too large" }, { status:413,headers });
    const body = JSON.parse(raw), action = String(body?.action || "sync"), deviceId = safeId(body?.deviceId), ownerHash = secretHash(body?.ownerSecret);
    const key = "device/" + deviceId, store = pushStore();
    const existing = await store.get(key, { type: "json" }) as DeviceRecord | null;
    if (existing?.ownerHash && !sameHash(existing.ownerHash, ownerHash)) return Response.json({ ok:false,error:"Device ownership check failed" }, { status:403,headers });

    if (action === "unsubscribe") {
      if (existing) await store.delete(key);
      return Response.json({ ok: true }, { headers });
    }

    const record: DeviceRecord = {
      ...(existing || { deviceId, ownerHash }),
      deviceId,
      ownerHash,
      timezone: String(body?.timezone || existing?.timezone || "UTC").slice(0, 80),
      updatedAt: new Date().toISOString()
    };
    if (body?.subscription) {
      const endpoint = String(body.subscription?.endpoint || "");
      if (!/^https:\/\//i.test(endpoint)) throw new Error("Invalid push subscription endpoint");
      record.subscription = body.subscription;
    }
    if (Array.isArray(body?.schedules)) {
      record.schedules = body.schedules
        .filter((x: any) => x && x.id && x.fireAt && x.title)
        .slice(0, 1000)
        .map((x: any) => ({
          id: String(x.id).slice(0, 180), fireAt: String(x.fireAt), title: String(x.title).slice(0, 140),
          body: String(x.body || "").slice(0, 260), view: String(x.view || "").slice(0, 80), tag: String(x.tag || x.id).slice(0, 180)
        }));
    }
    record.sent = record.sent && typeof record.sent === "object" ? record.sent : {};
    if (!record.subscription) return Response.json({ ok: false, error: "No push subscription." }, { status: 400, headers });
    if (action === "test") await sendTest(record.subscription);
    await store.setJSON(key, record);
    return Response.json({ ok: true, scheduleCount: record.schedules?.length || 0, registeredAt: record.updatedAt }, { headers });
  } catch (error: any) {
    console.error("Second Brain push register", error);
    return Response.json({ ok: false, error: error?.message || "Push registration failed." }, { status: 400, headers });
  }
};

export const config: Config = { path: "/api/push/register" };
