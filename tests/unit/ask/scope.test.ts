import { describe, expect, it } from "vitest";
import { inScope } from "@/lib/ask/scope";
import type { Corpus } from "@/lib/ask/types";

const corpus = (hash: string, ...texts: string[]): Corpus => ({
  hash,
  chunks: texts.map((text, i) => ({ id: `t/x/${i + 1}`, project: "t", section: "x", file: "t", text })),
});

const C = corpus(
  "scope-test",
  "Keel answers questions about filings with hybrid search over a world of documents.",
  "The app shows the weather and today's storage levels in the United States.",
  "Built with Postgres and a fast eval harness that measures recall.",
);

describe("inScope", () => {
  it("accepts a question made of corpus words", () => {
    expect(inScope("how does hybrid search measure recall", [], C)).toBe(true);
  });

  it("refuses two unknown content words when no project is named", () => {
    expect(inScope("who won the world cup", [], C)).toBe(false);
  });

  it("refuses one unknown word next to at most one known word when no project is named", () => {
    expect(inScope("explain quantum search to me", [], C)).toBe(false);
  });

  it("refuses a question with no content words unless a project is named", () => {
    expect(inScope("tell me about it", [], C)).toBe(false);
    expect(inScope("tell me about it", ["keel"], C)).toBe(true);
  });

  it("refuses an unanchored question with two or fewer known words", () => {
    expect(inScope("what's the weather today", [], C)).toBe(false);
  });

  it("accepts an unanchored question with three known words", () => {
    expect(inScope("which app shows storage levels", [], C)).toBe(true);
  });

  it("a person or portfolio anchor lifts the unanchored rule", () => {
    expect(inScope("what does he say about the weather", [], C)).toBe(true);
    expect(inScope("which project uses postgres", [], C)).toBe(true);
  });

  it("a named project tolerates two unknown words only when known words outnumber them", () => {
    expect(inScope("how quickly does keel detect stale filings in hybrid search", ["keel"], C)).toBe(true);
    expect(inScope("does keel know quantum gravity", ["keel"], C)).toBe(false);
  });

  it("does not count generic question words, contraction fragments or quantity words", () => {
    expect(inScope("explain, describe and summarize how many filings keel's search measures", [], C)).toBe(true);
  });

  it("knows alias keys and targets that are not in the corpus text", () => {
    expect(inScope("explain retrospective sprint agile", [], C)).toBe(true);
  });

  it("knows -ing and -ed forms of corpus words", () => {
    expect(inScope("which app measured storage while searching filings", [], C)).toBe(true);
  });

  it("builds a separate vocabulary for each corpus", () => {
    const other = corpus("scope-test-2", "Nothing about any sport here.", "Cup final and trophy results archive.");
    expect(inScope("who won the world cup", [], C)).toBe(false);
    expect(inScope("which cup final results archive", [], other)).toBe(true);
    expect(inScope("which cup final results archive", [], C)).toBe(false);
  });

  it("common English and conversational filler never count as unknown", () => {
    expect(inScope("hey can u pls give me the quick rundown on him, thanks", [], C)).toBe(true);
    expect(inScope("honestly what is the most impressive hybrid search thing here", [], C)).toBe(true);
  });

  it("with a person anchor, refuses only when two or more unknown topic words outnumber the known ones", () => {
    expect(inScope("why does he jump between filings", [], C)).toBe(true);
    expect(inScope("what does he think about quantum gravity", [], C)).toBe(false);
  });

  it("the person behind the site is an anchor", () => {
    expect(inScope("who is the guy behind this", [], C)).toBe(true);
  });

  it("a question with only filler and no anchor or project is still out of scope", () => {
    expect(inScope("hey thanks", [], C)).toBe(false);
  });
});
