/*
 * Docs used (installed ai@7.0.176, node_modules/ai/docs/; @ai-sdk/anthropic@4, its docs/05-anthropic.mdx):
 *  - 03-ai-sdk-core/10-generating-structured-data.mdx: generateText({ output: Output.object({ schema }) })
 *    validates against a zod schema; the parsed value is `result.output`.
 *  - 02-getting-started/00-choosing-a-provider.mdx: a plain "provider/model" string as `model`
 *    routes through Vercel AI Gateway; `createAnthropic()` from @ai-sdk/anthropic calls Anthropic directly
 *    (it reads ANTHROPIC_API_KEY from the environment).
 *  - 03-ai-sdk-core/25-settings.mdx: temperature, maxOutputTokens, maxRetries (default 2, 0 disables),
 *    abortSignal: AbortSignal.timeout(ms).
 *  - 05-anthropic.mdx, Effort: claude-haiku-5-5 thinks adaptively by default; `thinking: { type: "disabled" }`
 *    is accepted at effort high or below. Thinking tokens would count against the 300-token cap, so it is off.
 *    Current Claude models (Haiku/Sonnet/Opus 5.5) reject sampling parameters: the provider drops `temperature`
 *    and logs a warning (anthropic-model-catalog.ts, rejectsSamplingParameters). So no temperature is sent;
 *    determinism rests on the answer cache, and the live eval measures run-to-run stability instead.
 * The citations enum is built per call from the supplied chunk IDs.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT, buildUserMessage, type AnswerProvider } from "./provider";
import { MODEL_ID } from "./types";

/** The answer model when ANTHROPIC_API_KEY is set (direct Anthropic API). */
export const ANTHROPIC_MODEL_ID = "claude-haiku-5-5";

export type CallUsage = { model: string; inputTokens: number; outputTokens: number };
export type ProviderOptions = { model?: string; onUsage?: (u: CallUsage) => void };

// Shared by both paths: identical prompt, schema and settings.
function structuredProvider(model: LanguageModel, modelId: string, onUsage?: (u: CallUsage) => void): AnswerProvider {
  return {
    async generate({ question, chunks }) {
      const ids = chunks.map((c) => c.id);
      const citation = ids.length > 0 ? z.enum(ids as [string, ...string[]]) : z.never();
      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: buildUserMessage(question, chunks),
        output: Output.object({
          schema: z.object({
            answerable: z.boolean(),
            answer: z.string(),
            citations: z.array(citation),
          }),
        }),
        maxOutputTokens: 300,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(8000),
        providerOptions: { anthropic: { thinking: { type: "disabled" } } },
      });
      onUsage?.({ model: modelId, inputTokens: result.usage.inputTokens ?? 0, outputTokens: result.usage.outputTokens ?? 0 });
      const { output } = result;
      return { answerable: output.answerable, answer: output.answer, citations: output.citations };
    },
  };
}

export function gatewayProvider(opts: ProviderOptions = {}): AnswerProvider {
  const id = opts.model ?? MODEL_ID;
  return structuredProvider(id, id, opts.onUsage);
}

export function anthropicProvider(opts: ProviderOptions = {}): AnswerProvider {
  const id = opts.model ?? ANTHROPIC_MODEL_ID;
  return structuredProvider(createAnthropic()(id), id, opts.onUsage);
}

/** ANTHROPIC_API_KEY present: the direct provider; otherwise AI Gateway. The model ID keys the answer cache. */
export function selectProvider(env: Record<string, string | undefined> = process.env): { provider: () => AnswerProvider; modelId: string } {
  return env.ANTHROPIC_API_KEY
    ? { provider: () => anthropicProvider(), modelId: ANTHROPIC_MODEL_ID }
    : { provider: () => gatewayProvider(), modelId: MODEL_ID };
}
