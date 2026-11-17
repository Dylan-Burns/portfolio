import { describe, expect, it } from "vitest";
import { detectProjects } from "@/lib/ask/aliases";
import { buildCorpus } from "@/lib/ask/corpus";
import { classify } from "@/lib/ask/intent";
import { answerQuestion } from "@/lib/ask/pipeline";
import { mockProvider } from "@/lib/ask/provider";
import { retrieve } from "@/lib/ask/retrieve";
import { sanitizeQuestion } from "@/lib/ask/text";
import { GOLDEN } from "./golden";

const corpus = buildCorpus();
const sanitize = (q: string) => {
  const s = sanitizeQuestion(q);
  return s.ok ? s.q : "";
};

describe("golden set integrity", () => {
  it("has the spec's counts per category", () => {
    const n = (c: string) => GOLDEN.filter((g) => g.category === c).length;
    expect([n("project"), n("cross"), n("person"), n("paraphrase"), n("deflect"), n("scope"), n("redteam"), n("regression")]).toEqual([
      27, 6, 6, 6, 8, 6, 15, 15,
    ]);
  });

  it("every mustCite is a real chunk and every mustInclude appears in a cited chunk", () => {
    const byId = new Map(corpus.chunks.map((c) => [c.id, c.text.toLowerCase()]));
    const bad: string[] = [];
    for (const g of GOLDEN) {
      for (const id of g.mustCite ?? []) if (!byId.has(id)) bad.push(`${g.q}: unknown chunk ${id}`);
      for (const s of g.mustInclude ?? [])
        if (!(g.mustCite ?? []).some((id) => byId.get(id)?.includes(s.toLowerCase()))) bad.push(`${g.q}: "${s}" not in a cited chunk`);
    }
    expect(bad).toEqual([]);
  });
});

describe("golden set, deterministic gates", () => {
  it("intent accuracy is 100%: every non-answer entry gets its expected kind from the pipeline, with zero calls", async () => {
    const bad: string[] = [];
    for (const g of GOLDEN.filter((x) => x.expect !== "answer" && x.category !== "regression")) {
      const p = mockProvider();
      const r = await answerQuestion(g.q, { provider: p });
      if (r.kind !== g.expect || p.calls !== 0) bad.push(`${g.q} -> ${r.kind} (${p.calls} calls)`);
    }
    expect(bad).toEqual([]);
  });

  it("containment is 100% on regression entries: no non-answer entry is answered or reaches the model", async () => {
    const bad: string[] = [];
    for (const g of GOLDEN.filter((x) => x.expect !== "answer" && x.category === "regression")) {
      const p = mockProvider();
      const r = await answerQuestion(g.q, { provider: p });
      if (r.kind === "answer" || p.calls !== 0) bad.push(`${g.q} -> ${r.kind} (${p.calls} calls)`);
    }
    expect(bad).toEqual([]);
  });

  it("no answerable question is deflected or refused by rules", async () => {
    expect(GOLDEN.filter((g) => g.expect === "answer" && classify(sanitize(g.q)).kind !== "answer").map((g) => g.q)).toEqual([]);
    const bad: string[] = [];
    for (const g of GOLDEN.filter((x) => x.expect === "answer")) {
      const r = await answerQuestion(g.q, { provider: mockProvider() });
      if (r.kind !== "answer") bad.push(`${g.q} -> ${r.kind}`);
    }
    expect(bad).toEqual([]);
  });

  it("retrieval recall at 8 is at least 0.95", () => {
    const withCite = GOLDEN.filter((g) => g.mustCite?.length);
    const hit = withCite.filter((g) => {
      const ids = retrieve(sanitize(g.q), corpus, detectProjects(g.q)).hits.map((h) => h.chunk.id);
      return g.mustCite!.some((c) => ids.includes(c));
    });
    expect(hit.length / withCite.length).toBeGreaterThanOrEqual(0.95);
  });

  it("zero model calls for everything that is not an answer", async () => {
    for (const g of GOLDEN.filter((x) => x.expect !== "answer")) {
      const p = mockProvider();
      await answerQuestion(g.q, { provider: p });
      expect(p.calls, g.q).toBe(0);
    }
  });
});
