import type { Config, Context } from "@netlify/functions";

export default async (_req: Request, _context: Context) => {
  const publicKey = Netlify.env.get("VAPID_PUBLIC_KEY") || "";
  if (!publicKey) {
    return Response.json({ ok: false, error: "Push is not configured." }, { status: 503 });
  }
  return Response.json({ ok: true, publicKey });
};

export const config: Config = {
  path: "/api/push/config"
};
