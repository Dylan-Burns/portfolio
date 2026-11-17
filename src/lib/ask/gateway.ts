/*
 * Docs used (installed ai@7.0.176, node_modules/ai/docs/):
 *  - 03-ai-sdk-core/10-generating-structured-data.mdx: generateText({ output: Output.object({ schema }) })
 *    validates against a zod schema; the parsed value is `result.output`.
 *  - 02-getting-started/00-choosing-a-provider.mdx: a plain "provider/model" string as `model`
 *    routes through Vercel AI Gateway (here MODEL_ID).
 *  - 03-ai-sdk-core/25-settings.mdx: temperature, maxOutputTokens, maxRetries (default 2, 0 disables),
 *    abortSignal: AbortSignal.timeout(ms).
 * The citations enum is built per call from the supplied chunk IDs.
 */
import { generateText, Output } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT, buildUserMessage, type AnswerProvider } from "./provider";
import { MODEL_ID } from "./types";

export function gatewayProvider(): AnswerProvider {
  return {
    async generate({ question, chunks }) {
      const ids = chunks.map((c) => c.id);
      const citation = ids.length > 0 ? z.enum(ids as [string, ...string[]]) : z.never();
      const { output } = await generateText({
        model: MODEL_ID,
        system: SYSTEM_PROMPT,
        prompt: buildUserMessage(question, chunks),
        output: Output.object({
          schema: z.object({
            answerable: z.boolean(),
            answer: z.string(),
            citations: z.array(citation),
          }),
        }),
        temperature: 0,
        maxOutputTokens: 300,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(8000),
      });
      return { answerable: output.answerable, answer: output.answer, citations: output.citations };
    },
  };
}
