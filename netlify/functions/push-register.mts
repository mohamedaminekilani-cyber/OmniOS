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

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(req.url).host; } catch { return false; }
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
    title: "OmniOS notifications are ready",
    body: "This is a test push from your installed OmniOS app.",
    view: "reminders",
    tag: "omnios-push-test"
  }), { TTL: 300 });
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });

  try {
    const body = await req.json();
    const action = String(body?.action || "sync");
    const deviceId = safeId(body?.deviceId);
    const key = `device/${deviceId}`;
    const store = pushStore();

    if (action === "unsubscribe") {
      await store.delete(key);
      return Response.json({ ok: true });
    }

    const existing = (await store.get(key, { type: "json" }) as DeviceRecord | null) || { deviceId };
    const record: DeviceRecord = {
      ...existing,
      deviceId,
      timezone: String(body?.timezone || existing.timezone || "UTC").slice(0, 80),
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

    if (!record.subscription) {
      return Response.json({ ok: false, error: "No push subscription." }, { status: 400 });
    }

    if (action === "test") await sendTest(record.subscription);
    await store.setJSON(key, record);
    return Response.json({ ok: true, scheduleCount: record.schedules?.length || 0 });
  } catch (error: any) {
    console.error("OmniOS push register", error);
    return Response.json({ ok: false, error: error?.message || "Push registration failed." }, { status: 400 });
  }
};

export const config: Config = {
  path: "/api/push/register"
};
