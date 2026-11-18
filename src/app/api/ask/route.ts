/*
 * Docs used (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md):
 * route handlers take a Web Request and return a Response; the default runtime is nodejs, so none is
 * set here; a route file may export only handlers and segment config, so the logic lives in
 * src/lib/ask/handler.ts.
 */
import { site } from "@/content/site";
import { createDailyCeiling, createLimiter } from "@/lib/ask/guard";
import { handleAsk, type HandlerDeps } from "@/lib/ask/handler";
import { selectProvider } from "@/lib/ask/gateway";
import type { AskReply } from "@/lib/ask/types";

// Bounds the whole function; the provider call has its own 8 s timeout.
export const maxDuration = 15;

// ANTHROPIC_API_KEY present: the direct Anthropic provider; otherwise AI Gateway.
// Spend controls: on the gateway path, the AI Gateway monthly budget. On the direct path the gateway is
// bypassed and its budget does NOT apply: the only provider-side cap is the spend limit on the Anthropic
// workspace that owns the key (required before ASK_ENABLED=1). The Vercel Firewall rate-limit rule is the
// rate control on both paths.
// In code there are only per-instance bounds, which reset on a cold start and multiply with instances:
// the per-IP limiter (8 a minute) and the daily call ceiling (500 model calls per UTC day).
const selected = selectProvider();

const deps: HandlerDeps = {
  provider: selected.provider,
  modelId: selected.modelId,
  limiter: createLimiter(),
  ceiling: createDailyCeiling(),
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
