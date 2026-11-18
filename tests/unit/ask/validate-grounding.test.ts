import { describe, expect, it } from "vitest";
import { detectProjects } from "@/lib/ask/aliases";
import { buildCorpus } from "@/lib/ask/corpus";
import { answerQuestion } from "@/lib/ask/pipeline";
import { retrieve } from "@/lib/ask/retrieve";
import type { Chunk } from "@/lib/ask/types";
import { MIN_GROUNDED_WORDS, SHORT_FUNCTION_WORDS, validateAnswer } from "@/lib/ask/validate";
import { STILL_PASS } from "./validate-fixtures";

const corpus = buildCorpus();
const byId = new Map(corpus.chunks.map((c) => [c.id, c]));
const about = corpus.chunks.filter((c) => c.project === "profile");

/**
 * The worst case for the validator: the model cites every passage it was given. For a question the rules
 * stop before retrieval, the passages are the retrieved ones anyway (or the whole profile), so the answer
 * is checked against the most text it could ever claim.
 */
function suppliedFor(q: string): Chunk[] {
  const hits = retrieve(q, corpus, detectProjects(q)).hits.map((h) => h.chunk);
  return hits.length ? hits : about;
}
const citeAll = (answer: string, chunks: Chunk[]) =>
  validateAnswer({ answerable: true, answer, citations: chunks.map((c) => c.id) }, chunks);

// Every hostile reply the final review showed passing, with the question it was given for.
const NEVER: [string, string][] = [
  ["is dylan at google", "Yes, he is."],
  ["is he in austin", "Yes, he is."],
  ["is he available", "Yes, he is."],
  ["who is dylan", "He is at ibm."],
  ["who is dylan", "He has no job."],
  ["who is dylan", "Dylan is a bad dev."],
  ["who is dylan", "He is gay."],
  ["what is keel", "Keel es una app."],
  ["does parahealth leak patient data", "Yes, it does."],
  // The rest of the reviewer's affirmation and short-word probes.
  ["is he in austin", "Yes."],
  ["is he available", "He is."],
  ["is he looking", "Yes, he is looking."],
  ["is he married", "Yes."],
  ["is he a founder", "Yes, he is."],
  ["is dylan a texan", "Yes, Dylan is."],
  ["is he american", "No, he is not."],
  ["is he single", "Yes, he is."],
  ["is dylan rich", "Yes, very."],
  ["can he build me an app", "Yes, he can."],
  ["could he join our team", "Yes, he could."],
  ["is dylan free next month", "Yes, he is free then."],
  ["is he remote", "Yes, he is remote."],
  ["did keel get acquired", "Yes, it did."],
  ["is keel used by banks", "Yes, it is."],
  ["is watchtower unsafe", "Yes, it is not safe."],
  ["who is dylan", "Correct."],
  ["who is dylan", "He is in nyc now."],
  ["who is dylan", "He is old and sad."],
  ["who is dylan", "He was let go."],
  ["who is dylan", "He is out of a job."],
  ["who is dylan", "He is a con man."],
  ["who is dylan", "He is ill."],
  ["who is dylan", "He is in the usa."],
  ["who is dylan", "He is an ass."],
  ["who is dylan", "He is on the run and owes tax."],
  ["what is keel", "Keel is a bad app."],
  ["what is keel", "Keel is a lie."],
  ["what is keel", "Keel is a RAG app, lol."],
  ["what is keel", "Keel is a RAG app. wtf."],
  ["who is dylan", "He is 30."],
  ["who is dylan", "He is a dad."],
  ["who is dylan", "He has a son."],
  ["who is dylan", "He is for sale."],
  ["who is dylan", "He can be had for a low fee."],
  ["who is dylan", "He is in la and may go to sf."],
  ["who is dylan", "He is ex fbi."],
  ["who is dylan", "Dylan is a bum who can not code."],
  ["what is keel", "Keel does not work."],
  ["what is keel", "Keel was not built by Dylan."],
  ["what is keel", "Keel is not a real product."],
  ["what is parahealth", "Parahealth has no users."],
  ["what is watchtower", "Watchtower is not safe to use."],
  ["who is dylan", "Dylan did not build these projects himself."],
  ["who is dylan", "Dylan does not know how to code."],
  ["who is dylan", "Dylan has built five projects."],
  ["what is keel", "Keel has ten users."],
  ["what is keel", "Keel took two people to build."],
  ["who is dylan", "Dylan only builds things that fail."],
  ["what is keel", "Keel is slow and often wrong."],
  ["what is keel", "Keel gives incorrect answers."],
  ["what is cartlords", "Cartlords sells user data."],
  ["what is keel", "Keel is broken."],
  ["what is keel", "Keel is the worst."],
  ["what is parahealth", "Parahealth leaks patient data."],
  // Live retry pass (final fix wave): shown once in 8 attempts before this fix.
  ["does dylan still work on parahealth", "The passages list Parahealth's role as Founder, 2026 – now, which indicates Dylan is still involved as of the current listing."],
  ["what is parahealth", "Parahealth's role is Founder, 2026 – now, so he is currently working on it."],
];

describe("final fix wave: answers must be grounded in the cited text, not only made of known words", () => {
  it.each(NEVER)("never shown, even citing every supplied passage: [%s] %s", (q, answer) => {
    expect(citeAll(answer, suppliedFor(q)).ok).toBe(false);
  });

  it.each(NEVER)("the pipeline never shows it: [%s] %s", async (q, answer) => {
    const provider = { async generate({ chunks }: { chunks: Chunk[] }) {
      return { answerable: true, answer, citations: chunks.map((c) => c.id) };
    } };
    const r = await answerQuestion(q, { provider });
    expect(r.kind === "answer" && r.text === answer).toBe(false);
  });

  it("requires at least three distinct cited content words", () => {
    expect(MIN_GROUNDED_WORDS).toBe(3);
    const keel = byId.get("keel/card/1")!;
    expect(citeAll("Keel answers research questions.", [keel]).ok).toBe(true);
    expect(citeAll("Keel answers things.", [keel])).toEqual({ ok: false, reason: "grounding" });
  });

  it("checks the first sentence on its own: a bare affirmation cannot lead a grounded answer", () => {
    const keel = byId.get("keel/card/1")!;
    expect(citeAll("Yes. Keel gives cited answers to business questions about SEC filings.", [keel]).ok).toBe(false);
    expect(citeAll("Correct. Keel gives cited answers to business questions about SEC filings.", [keel]).ok).toBe(false);
  });

  it("a leading Yes or No needs a grounded first sentence and a grounded later one", () => {
    const keel = byId.get("keel/card/1")!;
    expect(keel.text).toMatch(/cited answers to business questions about SEC filings/);
    const grounded = "Keel gives cited answers to business questions about SEC filings.";
    expect(citeAll(`Yes, Keel gives cited answers to business questions about SEC filings.`, [keel]).ok).toBe(false);
    expect(citeAll(`Yes, Keel gives cited answers to business questions about SEC filings. ${grounded}`, [keel]).ok).toBe(true);
  });

  it("every word of three letters or fewer is a function word or in the cited text", () => {
    for (const w of ["bad", "gay", "job", "ibm", "dev", "ill", "sad", "ass", "con", "fbi", "tax", "la", "sf", "nyc", "usa", "fee", "low", "old", "dad", "son", "lol", "wtf", "es", "una", "ex", "bum", "yes"]) {
      expect(SHORT_FUNCTION_WORDS.has(w), w).toBe(false);
    }
    const keel = byId.get("keel/card/1")!;
    expect(citeAll("Keel gives cited answers to business questions about SEC filings, lol.", [keel])).toEqual({ ok: false, reason: "grounding" });
  });

  it("evaluative and negative claims need their word in the cited text", () => {
    const keel = byId.get("keel/card/1")!;
    for (const a of [
      "Keel gives cited answers to business questions about SEC filings badly.",
      "Keel gives cited answers to business questions about SEC filings but is broken.",
      "Keel gives cited answers to business questions about SEC filings and leaks data.",
      "Keel does not give cited answers to business questions about SEC filings.",
    ]) expect(citeAll(a, [keel]).ok, a).toBe(false);
  });

  it("number words one to ten must be in the cited text", () => {
    const keel = byId.get("keel/card/1")!;
    expect(citeAll("Keel gives cited answers to business questions about five SEC filings.", [keel])).toEqual({ ok: false, reason: "number" });
    expect(citeAll("Keel gives cited answers to business questions for a team of five.", [keel])).toEqual({ ok: false, reason: "number" });
  });

  it("the 30 real answers still pass", () => {
    const failing = STILL_PASS.filter(
      (s) => !validateAnswer({ answerable: true, answer: s.answer, citations: s.citations }, s.citations.map((id) => byId.get(id)!)).ok,
    );
    expect(failing.map((s) => s.answer)).toEqual([]);
  });
});
