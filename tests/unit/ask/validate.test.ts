import { describe, it, expect } from "vitest";
import { buildCorpus } from "@/lib/ask/corpus";
import { touchesDeflectTopic } from "@/lib/ask/intent";
import type { Chunk, ModelAnswer } from "@/lib/ask/types";
import { ANSWER_MAX_CHARS, validateAnswer } from "@/lib/ask/validate";

const chunk = (id: string, text: string): Chunk => ({ id, project: "keel", section: "outcomes", file: "keeldd.com", text });
const chunks = [chunk("keel/outcomes/1", "Keel faithfulness 0.94, citation precision 1.00, about $0.09 per question.")];
const base: ModelAnswer = {
  answerable: true,
  answer: "Keel scores 0.94 on faithfulness at about $0.09 per question.",
  citations: ["keel/outcomes/1"],
};
const check = (answer: string, text: string, extra: Chunk[] = []) => {
  const c = chunk("a/b/1", text);
  return validateAnswer({ answerable: true, answer, citations: [c.id] }, [c, ...extra]);
};
const OK = { ok: true };
const bad = (reason: string) => ({ ok: false, reason });

describe("validateAnswer", () => {
  it("exposes the length cap", () => {
    expect(ANSWER_MAX_CHARS).toBe(600);
  });
  it("accepts a grounded answer", () => {
    expect(validateAnswer(base, chunks)).toEqual({ ok: true });
  });
  it.each([
    [{ ...base, answerable: false }, "unanswerable"],
    [{ ...base, citations: [] }, "no_citation"],
    [{ ...base, citations: ["syene/card/1"] }, "foreign_citation"],
    [{ ...base, answer: "Keel scores 0.97 on faithfulness." }, "number"],
    [{ ...base, answer: "It costs $9 per question." }, "number"],
    [{ ...base, answer: "See https://evil.example for more." }, "link"],
    [{ ...base, answer: "Email a@b.co for details." }, "link"],
    [{ ...base, answer: "<b>Keel</b> is great." }, "markup"],
    [{ ...base, answer: "x".repeat(601) }, "length"],
    [{ ...base, answer: "Dylan is based in Texas and works at Acme." }, "name"],
    [{ ...base, answer: "Dylan works at the project." }, "deflect_topic"],
  ])("rejects %#", (a, reason) => {
    expect(validateAnswer(a, chunks)).toEqual({ ok: false, reason });
  });
  it("accepts an answer of exactly the max length", () => {
    expect(check("word ".repeat(119) + "word.", "word")).toEqual(OK);
  });

  describe("numbers", () => {
    it("treats 90%, 90 percent and 90 per cent as the same figure", () => {
      const t = "accuracy above 90% on high-confidence fields";
      expect(check("Accuracy is above 90 percent.", t)).toEqual(OK);
      expect(check("Accuracy is above 90 per cent.", t)).toEqual(OK);
      expect(check("Accuracy is above 90%.", "accuracy above 90 percent")).toEqual(OK);
    });
    it("ignores thousands separators", () => {
      expect(check("It handles 56,000 rows.", "handles 56000 rows")).toEqual(OK);
      expect(check("It handles 56000 rows.", "handles 56,000 rows")).toEqual(OK);
    });
    it("accepts ranges with either dash when the text has the same range", () => {
      expect(check("It takes 15–45 seconds.", "takes 15-45 seconds")).toEqual(OK);
      expect(check("It takes 15-45 seconds.", "takes 15–45 seconds")).toEqual(OK);
    });
    it("rejects a range the text does not contain", () => {
      expect(check("It takes 15-45 seconds.", "takes 15 seconds, sometimes 45")).toEqual(bad("number"));
      expect(check("It takes 15-50 seconds.", "takes 15-45 seconds")).toEqual(bad("number"));
    });
    it("requires a whole number token", () => {
      expect(check("It scores 9.", "scores 0.94")).toEqual(bad("number"));
      expect(check("It scores 9.", "scores 90")).toEqual(bad("number"));
      expect(check("It scores 94.", "scores 0.94")).toEqual(bad("number"));
    });
    it("accepts digits that are part of names when the token is in the text", () => {
      const t = "Reads 10-K filings, GLP-1 data, D1, S3 and FTS5.";
      expect(check("It reads 10-K filings, GLP-1 data, D1, S3 and FTS5.", t)).toEqual(OK);
    });
    it("rejects name digits not present in the text", () => {
      expect(check("It uses S4.", "It uses S3.")).toEqual(bad("number"));
      expect(check("It uses FTS6.", "It uses FTS5.")).toEqual(bad("number"));
    });
    it("requires years to appear in the cited text", () => {
      expect(check("Built in 2024.", "Built in 2024.")).toEqual(OK);
      expect(check("Built in 2023.", "Built in 2024.")).toEqual(bad("number"));
    });
    it("allows a number found in either of two cited chunks", () => {
      const a = chunk("keel/outcomes/1", "Precision 1.00.");
      const b = chunk("keel/outcomes/2", "Cost $0.09 per question.");
      const r = validateAnswer({ answerable: true, answer: "Precision 1.00 at $0.09.", citations: [a.id, b.id] }, [a, b]);
      expect(r).toEqual(OK);
    });
    it("rejects a number found only in a supplied but uncited chunk", () => {
      const a = chunk("keel/outcomes/1", "Precision 1.00.");
      const b = chunk("keel/outcomes/2", "Cost $0.09 per question.");
      const r = validateAnswer({ answerable: true, answer: "It costs $0.09.", citations: [a.id] }, [a, b]);
      expect(r).toEqual(bad("number"));
    });
  });

  describe("links", () => {
    it.each([
      "See http://evil.example/x now.",
      "Visit www.evil.example now.",
      "Visit evil.example now.",
      "Visit keeldd.com now.",
      "Write to someone@mail.example.",
    ])("flags %s", (answer) => {
      expect(check(answer, "Keel is a project.")).toEqual(bad("link"));
    });
    it("does not flag Next.js, Node.js or D3.js", () => {
      expect(check("Built with Next.js, Node.js and D3.js.", "Built with Next.js, Node.js and D3.js.")).toEqual(OK);
    });
  });

  describe("markup", () => {
    it.each([
      ["a <script>x</script> b"],
      ["a [site](page) b"],
      ["a ![img](x.png) b"],
      ["use `npm run` here"],
      ["```\ncode\n```"],
      ["a <system> tag"],
    ])("flags %j", (answer) => {
      expect(check(answer, "x")).toEqual(bad("markup"));
    });
    it("allows plain comparisons with a less-than sign", () => {
      expect(check("Latency is under 2 seconds.", "Latency is under 2 seconds.")).toEqual(OK);
    });
  });

  it("never rejects corpus text for deflect_topic", () => {
    const failing = buildCorpus().chunks.filter((c) => touchesDeflectTopic(c.text)).map((c) => c.id);
    expect(failing).toEqual([]);
  });

  describe("fix round 1: evasions", () => {
    const k = "Keel answers questions about SEC filings.";
    it.each([
      ["fullwidth digits", "Keel scores \uFF19\uFF17% on it.", "number"],
      ["fullwidth decimal", "It scores \uFF10\uFF0E\uFF19\uFF17 overall.", "number"],
      ["arabic-indic digits", "It scores \u0669\u0667 overall.", "number"],
      ["superscripts", "It scores \u2079\u2077 overall.", "number"],
      ["circled digit", "It has \u2460 overall.", "number"],
      ["spelled hyphenated", "It is ninety-seven percent accurate.", "number"],
      ["spelled hundred", "It costs a hundred dollars and twelve cents.", "number"],
      ["spaced dot", "Visit evil dot com now.", "link"],
      ["spaced domain", "Visit evil . com now.", "link"],
      ["fullwidth dot", "Visit evil\uFF0Ecom now.", "link"],
      ["zero-width in domain", "Visit evil\u200B.com now.", "link"],
      ["zero-width in scheme", "Visit ht\u200Btp://evil.x now.", "link"],
      ["at dot words", "Mail a at b dot co now.", "link"],
      ["bracketed at dot", "Mail a [at] b [dot] co now.", "link"],
      ["any tld", "Please see evil.de now.", "link"],
      ["uppercase tld", "Please see evil.DE now.", "link"],
      ["empty", "", "unanswerable"],
      ["whitespace only", "   \n\t ", "unanswerable"],
      ["foreign name Google", "Keel was built at Google.", "name"],
      ["foreign name Austin", "It was built in Austin.", "name"],
      ["curly brace", "It uses {x} here.", "markup"],
      ["pipe", "It uses a | b here.", "markup"],
      ["underscore", "It uses a_b here.", "markup"],
      ["emoji", "It is great \u{1F642}.", "markup"],
    ])("rejects %s", (_n, answer, reason) => {
      expect(check(answer, k)).toEqual(bad(reason));
    });
    it("allows a number word that the text uses, and unchecked small ones", () => {
      expect(check("It has twenty-five signals.", "Twenty-five energy signals.")).toEqual(OK);
      expect(check("It has two signals and ten more.", "Some signals.")).toEqual(OK);
      expect(check("It has twenty signals.", "Twenty-five energy signals.")).toEqual(bad("number"));
    });
    it("does not flag a sentence boundary without a space", () => {
      expect(check("It works.Then it ships.", "It works. Then it ships.")).toEqual(OK);
    });
    it("allows .js and .ts names", () => {
      expect(check("It uses Next.js and node.ts.", "Next.js and node.ts")).toEqual(OK);
    });
    it("normalizes cited text too", () => {
      expect(check("It scores 97 overall.", "It scores \uFF19\uFF17 overall.")).toEqual(OK);
    });
    it("passes names present in the cited chunk and ignores sentence-initial words", () => {
      expect(check("Keel answers questions about SEC filings.", k)).toEqual(OK);
      expect(check("Grounded answers are cited.", "Plain text.")).toEqual(OK);
      expect(check("It is useful. Grounded answers help.", "Plain text.")).toEqual(OK);
    });
    it("always allows Dylan, Burns and I", () => {
      expect(check("So I think Dylan Burns built it.", "Plain text.")).toEqual(OK);
    });
    it("compares hyphenated and dotted names whole", () => {
      expect(check("It uses Remote Retros and Cloudflare.", "Remote Retros runs on Cloudflare.")).toEqual(OK);
      expect(check("It uses Next.js.", "It uses Next and js.")).toEqual(bad("name"));
    });
    it("allows plain punctuation and math symbols", () => {
      expect(check("It is \u201Cfast\u201D \u2014 about ~2 seconds (\u2265 1).", "about 2 seconds 1")).toEqual(OK);
    });
  });

  describe("fix round 2", () => {
    const plain = "Keel answers questions about SEC filings.";
    it.each([
      ["Google employed him.", "name"],
      ["Ibm employed him.", "name"],
      ["Sarah helps with it.", "name"],
      ["he worked with sarah at stripe.", "name"],
      ["It was built in austin.", "name"],
      ["It uses google.", "name"],
      ["It is half of the baseline.", "number"],
      ["It is double the baseline.", "number"],
      ["It is a third of that.", "number"],
      ["It is ten times faster.", "number"],
      ["It is 3 times faster.", "number"],
      ["It runs twice a day.", "number"],
      ["It is tripled.", "number"],
      ["Most users like it.", "number"],
      ["The majority agree.", "number"],
      ["It serves thousands of users.", "number"],
      ["Visit hxxps://evil.x", "link"],
      ["Visit hxxp://evil.x", "link"],
      ["Open ftp://files.example now.", "link"],
      ["See evil.x now.", "link"],
    ])("rejects %s", (answer, reason) => {
      expect(check(answer, plain)).toEqual(bad(reason));
    });
    it("accepts relative-quantity words that the cited text uses", () => {
      expect(check("It is half of the baseline.", "It is half of the baseline.")).toEqual(OK);
      expect(check("It is ten times faster.", "It is ten times faster.")).toEqual(OK);
      expect(check("It is double the baseline.", "It is double the baseline.")).toEqual(OK);
    });
    it("does not treat 'times' without a number as relative", () => {
      expect(check("It runs at times.", "Plain text.")).toEqual(OK);
    });
    it("leaves abbreviations like e.g. and i.e. alone", () => {
      expect(check("It is small, e.g. fast, i.e. cheap.", "Plain text.")).toEqual(OK);
    });
    it("allows corpus vocabulary that the cited chunk does not use", () => {
      expect(check("It uses kiwix.", "Plain text.")).toEqual(OK);
    });
    it("treats entity names seen only capitalized in the corpus as ungrounded unless cited", () => {
      expect(check("Google employed him.", "Plain text.")).toEqual(bad("name"));
      expect(check("It uses google.", "Plain text.")).toEqual(bad("name"));
      expect(check("It signs in with Google.", "Sign in with Google.")).toEqual(OK);
    });
    it("allows sentence starters and common prose", () => {
      expect(check("The tool helps people. It also checks each answer.", "Plain text.")).toEqual(OK);
    });
    it("caches the corpus vocabulary across calls", () => {
      expect(check("It uses kiwix.", "Plain text.")).toEqual(OK);
      expect(check("It uses kiwix.", "Plain text.")).toEqual(OK);
    });
  });
});
