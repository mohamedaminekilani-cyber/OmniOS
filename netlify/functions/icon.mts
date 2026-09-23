import type { Config, Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";

function iconStore() {
  if (Netlify.context?.deploy?.context === "production") {
    return getStore("omnios-icons", { consistency: "strong" });
  }
  return getDeployStore("omnios-icons");
}

function safeId(value: unknown) {
  const id = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
  if (!id) throw new Error("Missing icon id");
  return id;
}

function allowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const source = new URL(origin);
    const target = new URL(req.url);
    if (source.host === target.host) return true;
    if (source.origin === "https://mohamedaminekilani-cyber.github.io") return true;
    return source.hostname === "omnios-pwa.netlify.app";
  } catch {
    return false;
  }
}

export default async (req: Request, _context: Context) => {
  if (!allowedOrigin(req)) return new Response("Forbidden", { status: 403 });

  try {
    const url = new URL(req.url);
    const id = safeId(url.searchParams.get("id"));
    const key = `icon/${id}`;
    const store = iconStore();

    if (req.method === "GET") {
      const icon = await store.get(key, { type: "arrayBuffer" }) as ArrayBuffer | null;
      if (!icon) return new Response("Icon not found", { status: 404 });
      return new Response(icon, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      });
    }

    if (req.method === "POST") {
      const body = await req.text();
      const match = body.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
      if (!match) return new Response("Expected PNG data URL", { status: 400 });
      const bytes = Buffer.from(match[1], "base64");
      if (!bytes.length || bytes.length > 1024 * 1024) return new Response("Invalid icon size", { status: 400 });
      const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      await store.set(key, data);
      return Response.json({ ok: true });
    }

    if (req.method === "DELETE") {
      await store.delete(key);
      return Response.json({ ok: true });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (error: any) {
    console.error("OmniOS icon endpoint", error);
    return Response.json({ ok: false, error: error?.message || "Icon request failed" }, { status: 400 });
  }
};

export const config: Config = {
  path: "/api/icon"
};
