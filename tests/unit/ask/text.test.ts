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
  it("expands synonyms toward corpus vocabulary", () => {
    expect(expandTokens(tokenize("medical paperwork"))).toEqual(expect.arrayContaining(["healthcare", "authorization"]));
  });
});
