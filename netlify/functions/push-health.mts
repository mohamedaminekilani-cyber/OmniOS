import type { Config, Context } from "@netlify/functions";

export default async (_req: Request, _context: Context) => {
  return new Response(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#06b6d4"/></svg>',
    { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } }
  );
};

export const config: Config = {
  path: "/api/push/health.svg"
};
