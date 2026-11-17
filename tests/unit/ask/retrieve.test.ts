import { describe, it, expect } from "vitest";
import { buildCorpus } from "@/lib/ask/corpus";
import { retrieve, TOP_K, PER_PROJECT_QUOTA, SCORE_FLOOR, CONTEXT_CHAR_BUDGET } from "@/lib/ask/retrieve";

const corpus = buildCorpus();
const ids = (q: string, p: string[] = []) => retrieve(q, corpus, p).hits.map((h) => h.chunk.id);

describe("retrieve", () => {
  it("finds the passage holding a specific figure", () => {
    expect(ids("what is keel's citation precision", ["keel"])).toContain("keel/outcomes/1");
  });
  it("restricts to named projects", () => {
    expect(retrieve("what stack", corpus, ["claruss"]).hits.every((h) => h.chunk.project === "claruss")).toBe(true);
  });
  it("represents both projects in a comparison", () => {
    const p = new Set(retrieve("how do keel and syene differ", corpus, ["keel", "syene"]).hits.map((h) => h.chunk.project));
    expect([...p].sort()).toEqual(["keel", "syene"]);
  });
  it("applies the per-project quota when no project is named", () => {
    const by = new Map<string, number>();
    for (const h of retrieve("which projects use postgres", corpus, []).hits) by.set(h.chunk.project, (by.get(h.chunk.project) ?? 0) + 1);
    expect(Math.max(...by.values())).toBeLessThanOrEqual(PER_PROJECT_QUOTA);
  });
  it("returns at most TOP_K hits within the character budget", () => {
    const { hits } = retrieve("what has dylan built", corpus, []);
    expect(hits.length).toBeLessThanOrEqual(TOP_K);
    expect(hits.reduce((n, h) => n + h.chunk.text.length, 0)).toBeLessThanOrEqual(CONTEXT_CHAR_BUDGET);
  });
  it("scores nonsense below the floor", () => {
    expect(retrieve("zxqv plorb wumpus", corpus, []).best).toBeLessThan(SCORE_FLOOR);
  });
  it("is deterministic", () => {
    expect(ids("what is parahealth")).toEqual(ids("what is parahealth"));
  });
  it.each([
    ["what is parahealth", ["parahealth"]],
    ["tell me about keel", ["keel"]],
    ["what is remoteretros.org built with", ["remoteretros"]],
  ])("a named project always brings its card and summary: %p", (q, p) => {
    const got = ids(q, p);
    expect(got).toEqual(expect.arrayContaining([`${p[0]}/card/1`, `${p[0]}/summary/1`]));
  });
  it("every named project gets its card when many are named", () => {
    const all = [...new Set(corpus.chunks.map((c) => c.project))].filter((p) => p !== "profile");
    expect(all.length).toBeGreaterThan(TOP_K);
    const got = ids("compare them all", all);
    expect(got).toHaveLength(TOP_K);
    expect(new Set(got.map((id) => id.split("/")[0])).size).toBe(TOP_K);
  });
  it("fills every slot when three projects are named", () => {
    const { hits } = retrieve("what stack and architecture do they use", corpus, ["keel", "syene", "watchtower"]);
    expect(hits).toHaveLength(TOP_K);
    expect(new Set(hits.map((h) => h.chunk.project))).toEqual(new Set(["keel", "syene", "watchtower"]));
  });
  it("finds principles by their section name", () => {
    expect(ids("what are his principles").some((id) => id.startsWith("profile/principles/"))).toBe(true);
  });
  it("returns hits best first", () => {
    const s = retrieve("what has dylan built", corpus, []).hits.map((h) => h.score);
    expect(s).toEqual([...s].sort((a, b) => b - a));
  });
});
