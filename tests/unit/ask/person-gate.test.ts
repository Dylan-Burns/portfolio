import { describe, expect, it } from "vitest";
import { detectProjects } from "@/lib/ask/aliases";
import { buildCorpus } from "@/lib/ask/corpus";
import { answerQuestion } from "@/lib/ask/pipeline";
import { mockProvider } from "@/lib/ask/provider";
import { personQuestionCovered } from "@/lib/ask/scope";
import { GOLDEN } from "./golden";
import { PERSONAL } from "./held-out-probes";

const corpus = buildCorpus();
const ask = async (q: string) => {
  const p = mockProvider();
  const r = await answerQuestion(q, { provider: p });
  return { kind: r.kind, calls: p.calls };
};

describe("final fix wave: questions about the person that the portfolio does not cover are deflected", () => {
  it.each([
    "who employs him", "is dylan at google", "where is dylan", "is he in austin", "is he available", "is he looking",
    "could he join our team", "how do I get hold of him", "is he single", "is he remote", "is dylan free next month",
    "is dylan busy", "where's he from", "the guy who built this, where's he from", "what does dylan do for a living",
    "what is his profession", "who are his clients", "is he a founder", "what languages does he speak",
    "what would it cost to have him build an app", "does he have capacity for a project", "can he build me an app",
    "i want to work with dylan", "is he free tomorrow", "does he own a house", "who did he vote for",
    "does dylan still work on parahealth", "is he still at keel", "is dylan currently working on syene",
  ])("%s: deflected, zero calls", async (q) => {
    expect(await ask(q)).toEqual({ kind: "deflect", calls: 0 });
  });

  it("contains at least 130 of the 139 held-out personal phrasings with zero model calls", async () => {
    const all = Object.values(PERSONAL).flat();
    expect(all).toHaveLength(139);
    const reached: string[] = [];
    for (const q of all) {
      const r = await ask(q);
      if (r.calls > 0 || r.kind === "answer") reached.push(q);
    }
    expect(reached.length, reached.join(" | ")).toBeLessThanOrEqual(9);
  });

  // Person-level questions the portfolio does answer: an intro shape, a word from the about or principles text,
  // a stack entry, or a portfolio-wide topic.
  it.each([
    "who is dylan", "who is he", "tell me about dylan", "tell me about him", "what does he do", "what is he like",
    "what is his background", "what kind of engineer is he", "what drives him", "can u give me the quick rundown on dylan",
    "what does dylan believe about measuring things", "how does he make decisions", "what fields is he interested in",
    "does he prefer range or depth", "what does he think about social media", "what are his principles",
    "what are dylans core values", "why does he jump between so many different industries", "what languages does dylan code in",
    "which of his projects involve maps", "how many projects has he built", "what has he built", "does dylan use postgres",
    "what has he shipped", "what is his stack", "what tools does he use", "what is his work like",
    "what is dylan good at", "what are his strengths", "what does he care about", "how does he work", "what is he curious about",
    "what are his interests", "what is he best known for", "what is he passionate about", "how does he approach problems",
    "does he use python", "has he used react", "does dylan know swift", "what does he value", "how does he measure success",
  ])("%s: still answerable", async (q) => {
    expect(detectProjects(q)).toEqual([]);
    expect(personQuestionCovered(q, [], corpus), q).toBe(true);
    expect(await ask(q)).toEqual({ kind: "answer", calls: 1 });
  });

  it("no golden answer entry is deflected by the person gate", () => {
    const bad = GOLDEN.filter((g) => g.expect === "answer" && !personQuestionCovered(g.q, detectProjects(g.q), corpus)).map((g) => g.q);
    expect(bad).toEqual([]);
  });

  it("a named project is never subject to the person gate", () => {
    expect(personQuestionCovered("what did he build for keel", ["keel"], corpus)).toBe(true);
  });
});
