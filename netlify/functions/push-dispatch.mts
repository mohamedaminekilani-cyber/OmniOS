import type { Config } from "@netlify/functions";
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

function configureWebPush() {
  const publicKey = Netlify.env.get("VAPID_PUBLIC_KEY") || "";
  const privateKey = Netlify.env.get("VAPID_PRIVATE_KEY") || "";
  const subject = Netlify.env.get("VAPID_SUBJECT") || "https://omnios-pwa.netlify.app";
  if (!publicKey || !privateKey) throw new Error("Push server keys are not configured");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function isGone(error: any) {
  return error?.statusCode === 404 || error?.statusCode === 410;
}

export default async () => {
  configureWebPush();
  const store = pushStore();
  const { blobs } = await store.list({ prefix: "device/" });
  const now = Date.now();
  const graceMs = 24 * 60 * 60 * 1000;
  const missedThresholdMs = 15 * 60 * 1000;

  for (const blob of blobs) {
    const record = await store.get(blob.key, { type: "json" }) as DeviceRecord | null;
    if (!record?.subscription) continue;

    const sent = record.sent && typeof record.sent === "object" ? record.sent : {};
    const schedules = Array.isArray(record.schedules) ? record.schedules : [];
    let changed = false;
    let invalid = false;

    for (const item of schedules) {
      const at = Date.parse(item.fireAt);
      if (!Number.isFinite(at) || at > now || at < now - graceMs || sent[item.id]) continue;

      try {
        const missed=at < now-missedThresholdMs;
        await webpush.sendNotification(record.subscription, JSON.stringify({
          title: missed ? ("Missed · "+(item.title || "Second Brain reminder")) : (item.title || "Second Brain reminder"),
          body: missed ? ("Scheduled earlier · "+(item.body || "Open Second Brain to review it.")) : (item.body || "You have something scheduled in Second Brain."),
          view: item.view || "reminders",
          tag: item.tag || item.id
        }), { TTL: 86400 });
        sent[item.id] = new Date().toISOString();
        changed = true;
      } catch (error: any) {
        console.error("Second Brain push dispatch", blob.key, error?.statusCode || error);
        if (isGone(error)) { invalid = true; break; }
      }
    }

    if (invalid) {
      await store.delete(blob.key);
      continue;
    }

    if (changed) {
      const recent = Object.entries(sent)
        .sort((a,b) => String(b[1]).localeCompare(String(a[1])))
        .slice(0, 600);
      record.sent = Object.fromEntries(recent);
      record.updatedAt = new Date().toISOString();
      await store.setJSON(blob.key, record);
    }
  }
};

export const config: Config = {
  schedule: "* * * * *"
};
