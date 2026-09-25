import type { Config, Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";
import webpush from "web-push";

type ScheduleItem = {
  id: string;
  fireAt: string;
  title: string;
  body?: string;
  view?: string;
  tag?: string;
};

type DeviceRecord = {
  deviceId: string;
  ownerHash?: string;
  subscription?: any;
  timezone?: string;
  schedules?: ScheduleItem[];
  sent?: Record<string,string>;
  updatedAt?: string;
};

function pushStore() {
  if (Netlify.context?.deploy?.context === "production") {
    return getStore("omnios-push", { consistency: "strong" });
  }
  return getDeployStore("omnios-push");
}

function safeId(value: unknown) {
  const id = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
  if (!id) throw new Error("Missing device id");
  return id;
}
function safeOwner(value: unknown) {
  const token = String(value || "");
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) throw new Error("Missing device ownership token");
  return token;
}
async function hashOwner(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function allowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    const target = new URL(req.url);
    if (source.host === target.host) return true;
    if (source.origin === "https://mohamedaminekilani-cyber.github.io") return true;
    return source.hostname === "omnios-pwa.netlify.app";
  } catch { return false; }
}
function corsHeaders(req: Request) {
  const origin=req.headers.get("origin")||"";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}
function json(req: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8" }
  });
}
function configureWebPush() {
  const publicKey = Netlify.env.get("VAPID_PUBLIC_KEY") || "";
  const privateKey = Netlify.env.get("VAPID_PRIVATE_KEY") || "";
  const subject = Netlify.env.get("VAPID_SUBJECT") || "https://omnios-pwa.netlify.app";
  if (!publicKey || !privateKey) throw new Error("Push server keys are not configured");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}
async function sendTest(subscription: any) {
  configureWebPush();
  await webpush.sendNotification(subscription, JSON.stringify({
    title: "Second Brain notifications are ready",
    body: "This is a test push from your installed Second Brain app.",
    view: "reminders",
    tag: "second-brain-push-test"
  }), { TTL: 300 });
}
function sameEndpoint(a: any,b: any){
  return !!a?.endpoint&&!!b?.endpoint&&String(a.endpoint)===String(b.endpoint);
}

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    if (!allowedOrigin(req)) return new Response(null,{status:403});
    return new Response(null,{status:204,headers:corsHeaders(req)});
  }
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!allowedOrigin(req)) return new Response("Forbidden", { status: 403 });

  try {
    const body = await req.json();
    const action = String(body?.action || "sync");
    const deviceId = safeId(body?.deviceId);
    const ownerToken = safeOwner(body?.ownerToken);
    const ownerHash = await hashOwner(ownerToken);
    const key = `device/${deviceId}`;
    const store = pushStore();
    const existing = (await store.get(key, { type: "json" }) as DeviceRecord | null);

    if (existing?.ownerHash && existing.ownerHash !== ownerHash) {
      return json(req,{ok:false,error:"Device ownership verification failed."},403);
    }
    if (existing && !existing.ownerHash && !sameEndpoint(existing.subscription,body?.subscription)) {
      return json(req,{ok:false,error:"Existing registration could not be safely claimed. Disable and re-enable push on this device."},409);
    }

    if (action === "unsubscribe") {
      if (!existing) return json(req,{ok:true});
      await store.delete(key);
      return json(req,{ ok: true });
    }

    const record: DeviceRecord = {
      ...(existing || { deviceId }),
      deviceId,
      ownerHash,
      timezone: String(body?.timezone || existing?.timezone || "UTC").slice(0, 80),
      updatedAt: new Date().toISOString()
    };

    if (body?.subscription) record.subscription = body.subscription;
    if (Array.isArray(body?.schedules)) {
      record.schedules = body.schedules
        .filter((x: any) => x && x.id && x.fireAt && x.title)
        .slice(0, 1000)
        .map((x: any) => ({
          id: String(x.id).slice(0, 180),
          fireAt: String(x.fireAt),
          title: String(x.title).slice(0, 140),
          body: String(x.body || "").slice(0, 260),
          view: String(x.view || "").slice(0, 80),
          tag: String(x.tag || x.id).slice(0, 180)
        }));
    }
    record.sent = record.sent && typeof record.sent === "object" ? record.sent : {};

    if (!record.subscription) return json(req,{ok:false,error:"No push subscription."},400);

    if (action === "test") await sendTest(record.subscription);
    await store.setJSON(key, record);
    return json(req,{ ok: true, scheduleCount: record.schedules?.length || 0, registeredAt: record.updatedAt });
  } catch (error: any) {
    console.error("Second Brain push register", error);
    return json(req,{ ok: false, error: error?.message || "Push registration failed." },400);
  }
};

export const config: Config = {
  path: "/api/push/register"
};
