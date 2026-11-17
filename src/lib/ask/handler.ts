import { checkOrigin, readQuestion } from "./guard";
import { REPLIES } from "./intent";
import { answerQuestion } from "./pipeline";
import type { AnswerProvider } from "./provider";
import type { AskReply } from "./types";

export type HandlerDeps = {
  /** Called at most once per answered question, and never when ask is off or the pipeline refuses. */
  provider: () => AnswerProvider;
  limiter: (key: string) => boolean;
  cache: Map<string, AskReply>;
  enabled: () => boolean;
  siteUrl: string;
};

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

const BUSY: AskReply = { kind: "busy", text: REPLIES.busy, sources: [] };
const INVALID: AskReply = { kind: "refuse", text: "That request isn't valid.", sources: [] };

const json = (body: AskReply, status = 200, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { ...HEADERS, ...extra } });

/** The site's own origins: as configured, plus the apex and www forms. */
function siteOrigins(siteUrl: string): string[] {
  const host = new URL(siteUrl).host.replace(/^www\./, "");
  const proto = new URL(siteUrl).protocol;
  return [new URL(siteUrl).origin, `${proto}//${host}`, `${proto}//www.${host}`];
}

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Guards run in order and each returns before the pipeline is called. Nothing here logs, and no
 * thrown error ever reaches the client: it becomes the generic busy reply.
 */
export async function handleAsk(req: Request, deps: HandlerDeps): Promise<Response> {
  try {
    if (req.method !== "POST") return json(INVALID, 405, { Allow: "POST" });

    const allowed = [...siteOrigins(deps.siteUrl), new URL(req.url).origin];
    if (!checkOrigin(req, allowed)) return json(INVALID, 403);

    if (!deps.limiter(clientKey(req))) return json(BUSY, 429);

    const read = await readQuestion(req);
    if (!read.ok) return json(INVALID, read.status);

    let provider: AnswerProvider | undefined;
    const lazy: AnswerProvider = {
      generate(input) {
        provider ??= deps.provider();
        return provider.generate(input);
      },
    };
    const reply = await answerQuestion(read.question, { provider: lazy, cache: deps.cache, enabled: deps.enabled() });
    return json(reply);
  } catch {
    return json(BUSY);
  }
}
