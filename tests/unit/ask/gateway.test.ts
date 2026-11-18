import { describe, expect, it } from "vitest";
import { ANTHROPIC_MODEL_ID, selectProvider } from "@/lib/ask/gateway";
import { MODEL_ID } from "@/lib/ask/types";

describe("selectProvider", () => {
  it("uses the direct Anthropic provider when ANTHROPIC_API_KEY is set", () => {
    const s = selectProvider({ ANTHROPIC_API_KEY: "test-placeholder" });
    expect(s.modelId).toBe(ANTHROPIC_MODEL_ID);
    expect(ANTHROPIC_MODEL_ID).toBe("claude-haiku-5-5");
  });

  it("falls back to AI Gateway without it", () => {
    expect(selectProvider({}).modelId).toBe(MODEL_ID);
    expect(selectProvider({ ANTHROPIC_API_KEY: "" }).modelId).toBe(MODEL_ID);
  });

});
