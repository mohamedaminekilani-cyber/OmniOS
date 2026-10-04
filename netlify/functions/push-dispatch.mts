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

    // Keep dispatch acknowledgements separate from the mutable device record.
    // push-register may replace schedules/subscription while notification sends are
    // in flight; writing only this key prevents dispatch from restoring stale data.
    const sentKey = `sent/${record.deviceId}`;
    const persistedSent = await store.get(sentKey, { type: "json" }) as Record<string,string> | null;
    const legacySent = record.sent && typeof record.sent === "object" ? record.sent : {};
    const sent = { ...legacySent, ...(persistedSent || {}) };
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
      await store.delete(sentKey);
      continue;
    }

    if (changed) {
      // Re-read only the acknowledgement key before committing. This merges any
      // acknowledgements written by an overlapping dispatch without touching the
      // latest schedules, subscription, timezone, owner, or other device fields.
      const latestSent = await store.get(sentKey, { type: "json" }) as Record<string,string> | null;
      const mergedSent: Record<string,string> = { ...(latestSent || {}) };
      for (const [id, at] of Object.entries(sent)) {
        const current = mergedSent[id];
        if (!current || Date.parse(at) > Date.parse(current)) mergedSent[id] = at;
      }
      const recent = Object.entries(mergedSent)
        .filter(([,at]) => Date.parse(at)>now-48*60*60*1000)
        .sort((a,b) => String(b[1]).localeCompare(String(a[1])))
        .slice(0, 2000);
      await store.setJSON(sentKey, Object.fromEntries(recent));
    }
  }
};

export const config: Config = {
  schedule: "* * * * *"
};
