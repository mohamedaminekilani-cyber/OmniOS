import type { Config, Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";

type RelayRecord = {
  id: string;
  at: number;
  from: string;
  sealed: string;
};

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

function safeCallback(value: unknown) {
  const callback = String(value || "");
  if (!/^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/.test(callback)) throw new Error("Invalid callback");
  return callback;
}

function script(callback: string, value: unknown, status = 200) {
  return new Response(`${callback}(${JSON.stringify(value)});`, {
    status,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

export default async (req: Request, _context: Context) => {
  const store = relayStore();

  try {
    if (req.method === "POST") {
      const length = Number(req.headers.get("content-length") || 0);
      if (length > 8_000_000) return new Response("Payload Too Large", { status: 413 });

      const body = JSON.parse(await req.text());
      const channel = safeToken(body?.channel, 80);
      const id = safeToken(body?.id, 64);
      const from = safeToken(body?.from || "device", 96);
      const sealed = String(body?.sealed || "");
      if (!sealed || sealed.length > 7_500_000) throw new Error("Invalid relay payload");

      const at = Date.now();
      const key = `message/${channel}/${String(at).padStart(13, "0")}-${id}`;
      const record: RelayRecord = { id, at, from, sealed };
      await store.setJSON(key, record);
      return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const channel = safeToken(url.searchParams.get("channel"), 80);
      const callback = safeCallback(url.searchParams.get("callback"));
      const after = Math.max(0, Number(url.searchParams.get("after") || 0) || 0);
      const prefix = `message/${channel}/`;
      const listed = await store.list({ prefix });
      const now = Date.now();
      const cutoff = now - 20 * 60 * 1000;

      const candidates = listed.blobs
        .map((x) => {
          const tail = x.key.slice(prefix.length);
          const at = Number(tail.slice(0, 13)) || 0;
          return { key: x.key, at };
        })
        .filter((x) => x.at > after)
        .sort((a, b) => a.at - b.at)
        .slice(0, 30);

      const messages: RelayRecord[] = [];
      for (const item of candidates) {
        const row = await store.get(item.key, { type: "json" }) as RelayRecord | null;
        if (row) messages.push(row);
      }

      const stale = listed.blobs
        .map((x) => ({ key: x.key, at: Number(x.key.slice(prefix.length, prefix.length + 13)) || 0 }))
        .filter((x) => x.at && x.at < cutoff)
        .slice(0, 20);
      if (stale.length) Promise.allSettled(stale.map((x) => store.delete(x.key)));

      return script(callback, { ok: true, messages, serverAt: now });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (error: any) {
    if (req.method === "GET") {
      try {
        const url = new URL(req.url);
        const callback = safeCallback(url.searchParams.get("callback"));
        return script(callback, { ok: false, error: error?.message || "Relay error", messages: [] }, 200);
      } catch {}
    }
    console.error("OmniOS sync relay", error);
    return new Response("Bad Request", { status: 400 });
  }
};

export const config: Config = {
  path: "/api/sync/relay"
};
