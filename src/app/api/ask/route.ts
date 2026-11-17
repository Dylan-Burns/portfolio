/*
 * Docs used (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md):
 * route handlers take a Web Request and return a Response; the default runtime is nodejs, so none is
 * set here; a route file may export only handlers and segment config, so the logic lives in
 * src/lib/ask/handler.ts.
 */
import { site } from "@/content/site";
import { createLimiter } from "@/lib/ask/guard";
import { handleAsk, type HandlerDeps } from "@/lib/ask/handler";
import { gatewayProvider } from "@/lib/ask/gateway";
import type { AskReply } from "@/lib/ask/types";

// Per server instance: resets on a cold start. The Vercel Firewall rule and the Gateway budget cap are
// the real abuse controls; this is a second layer.
const deps: HandlerDeps = {
  provider: gatewayProvider,
  limiter: createLimiter(),
  cache: new Map<string, AskReply>(),
  enabled: () => process.env.ASK_ENABLED === "1",
  siteUrl: site.url,
};

const handle = (request: Request) => handleAsk(request, deps);

export const POST = handle;
// Any other method gets the same 405 JSON and headers as the handler's own method check.
export const GET = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
