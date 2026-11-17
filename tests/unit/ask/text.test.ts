import { describe, it, expect } from "vitest";
import { sanitizeQuestion, tokenize, normalizeKey } from "@/lib/ask/text";
import { expandTokens, detectProjects } from "@/lib/ask/aliases";

describe("sanitizeQuestion", () => {
  it.each([
    [undefined, "not_text"],
    [42, "not_text"],
    ["", "empty"],
    ["   ", "empty"],
    ["??", "empty"],
    ["🙂🙂🙂", "empty"],
    ["a".repeat(301), "too_long"],
  ])("rejects %p", (raw, reason) => {
    expect(sanitizeQuestion(raw)).toEqual({ ok: false, reason });
  });
  it("strips control and zero-width characters and collapses space", () => {
    expect(sanitizeQuestion("what​ is\u0000  keel?\n")).toEqual({ ok: true, q: "what is keel?" });
  });
  it("NFKC-normalizes lookalikes", () => {
    expect(sanitizeQuestion("ｗｈａｔ is ｋｅｅｌ")).toEqual({ ok: true, q: "what is keel" });
  });
  it.each([["U+202E", "\u202e"], ["U+2066", "\u2066"], ["U+E0041", "\u{E0041}"], ["U+00AD", "\u00ad"], ["U+FE0F", "\ufe0f"], ["U+E0000", "\u{E0000}"], ["U+E0002", "\u{E0002}"], ["U+E001F", "\u{E001F}"], ["U+E000", "\ue000"]])(
    "removes %s",
    (_n, ch) => {
      expect(sanitizeQuestion(`what is${ch} keel`)).toEqual({ ok: true, q: "what is keel" });
    },
  );
  it("accepts exactly 300 characters", () => {
    expect(sanitizeQuestion("a".repeat(300))).toEqual({ ok: true, q: "a".repeat(300) });
  });
});

describe("tokenize", () => {
  it("lowercases, drops stopwords and strips a plural s", () => {
    expect(tokenize("What are the Prices?")).toEqual(["price"]);
  });
  it("normalizeKey ignores case, spacing and punctuation", () => {
    expect(normalizeKey("What is  Keel?!")).toBe(normalizeKey("what is keel"));
  });
});

describe("aliases", () => {
  it("detects projects by name, domain and alias", () => {
    expect(detectProjects("how do Keel and syene.ai differ")).toEqual(["syene", "keel"].sort());
    expect(detectProjects("tell me about the prior authorization product")).toEqual(["parahealth"]);
    expect(detectProjects("the screen time app")).toEqual(["claruss"]);
    expect(detectProjects("what is Remote Retro")).toEqual(["remoteretros"]);
  });
  it("detects projects by domain", () => {
    expect(detectProjects("what is syene.ai")).toEqual(["syene"]);
    expect(detectProjects("tell me about claruss.app")).toEqual(["claruss"]);
  });
  it("does not treat plain 'call' as Watchtower", () => {
    expect(detectProjects("is he on call this week")).toEqual([]);
  });
  it("meets plural and singular forms", () => {
    expect(tokenize("commodities")).toEqual(tokenize("commodity"));
    expect(expandTokens(tokenize("commodities"))).toEqual(expect.arrayContaining(["market", "energy"]));
    expect(detectProjects("which commodities")).toEqual(["syene"]);
  });
  it("expands synonyms toward corpus vocabulary", () => {
    expect(expandTokens(tokenize("medical paperwork"))).toEqual(expect.arrayContaining(["healthcare", "authorization"]));
  });
});
