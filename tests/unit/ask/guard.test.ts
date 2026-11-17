import { describe, expect, it } from "vitest";
import { checkOrigin, createLimiter, MAX_BODY_BYTES, readQuestion } from "@/lib/ask/guard";

const SITE = ["https://www.burnsdylan.com"];

describe("checkOrigin", () => {
  const mk = (headers: Record<string, string> = {}) =>
    new Request("https://www.burnsdylan.com/api/ask", { method: "POST", headers });

  it("allows an allowed origin and rejects others", () => {
    expect(checkOrigin(mk({ origin: "https://www.burnsdylan.com" }), SITE)).toBe(true);
    expect(checkOrigin(mk({ origin: "https://evil.example" }), SITE)).toBe(false);
    expect(checkOrigin(mk({ origin: "null" }), SITE)).toBe(false);
  });
  it("matches the origin exactly, not by prefix", () => {
    expect(checkOrigin(mk({ origin: "https://www.burnsdylan.com.evil.example" }), SITE)).toBe(false);
    expect(checkOrigin(mk({ origin: "http://www.burnsdylan.com" }), SITE)).toBe(false);
  });
  it("without an Origin, accepts only Sec-Fetch-Site: same-origin", () => {
    expect(checkOrigin(mk(), SITE)).toBe(false);
    expect(checkOrigin(mk({ "sec-fetch-site": "same-origin" }), SITE)).toBe(true);
    expect(checkOrigin(mk({ "sec-fetch-site": "cross-site" }), SITE)).toBe(false);
    expect(checkOrigin(mk({ "sec-fetch-site": "same-site" }), SITE)).toBe(false);
  });
  it("a present, disallowed Origin is rejected even with same-origin Sec-Fetch-Site", () => {
    expect(checkOrigin(mk({ origin: "https://evil.example", "sec-fetch-site": "same-origin" }), SITE)).toBe(false);
  });
});

describe("createLimiter", () => {
  it("limits per key per minute and recovers", () => {
    let t = 0;
    const ok = createLimiter(2, () => t);
    expect([ok("a"), ok("a"), ok("a"), ok("b")]).toEqual([true, true, false, true]);
    t = 61_000;
    expect(ok("a")).toBe(true);
  });
  it("does not let a key grow its window by being refused", () => {
    let t = 0;
    const ok = createLimiter(1, () => t);
    expect(ok("a")).toBe(true);
    t = 30_000;
    expect(ok("a")).toBe(false);
    t = 60_001;
    expect(ok("a")).toBe(true);
  });
  it("stays bounded under many distinct keys", () => {
    const t = 0;
    const ok = createLimiter(1, () => t, 50);
    for (let i = 0; i < 500; i++) ok(`k${i}`);
    expect(ok("k499")).toBe(false); // recent keys are still tracked
  });
});

describe("readQuestion", () => {
  const post = (body: BodyInit | null, type: string | null = "application/json") =>
    new Request("https://x/api/ask", { method: "POST", headers: type ? { "content-type": type } : {}, body });

  it("rejects wrong or missing content-type with 415", async () => {
    expect(await readQuestion(post("hi", "text/plain"))).toEqual({ ok: false, status: 415 });
    expect(await readQuestion(post("{}", null))).toEqual({ ok: false, status: 415 });
  });
  it("accepts a charset parameter on application/json", async () => {
    const r = await readQuestion(post(JSON.stringify({ question: "hi there" }), "application/json; charset=utf-8"));
    expect(r).toEqual({ ok: true, question: "hi there" });
  });
  it("rejects invalid JSON with 400", async () => {
    expect(await readQuestion(post("{not json"))).toEqual({ ok: false, status: 400 });
    expect(await readQuestion(post(null))).toEqual({ ok: false, status: 400 });
  });
  it("rejects any shape other than exactly { question: string } with 400", async () => {
    for (const body of [`"hi"`, "null", "[]", "[1]", "{}", `{"question":5}`, `{"question":null}`, `{"q":"x"}`, `{"question":"x","extra":1}`]) {
      expect(await readQuestion(post(body)), body).toEqual({ ok: false, status: 400 });
    }
  });
  it("rejects an oversized body with 413", async () => {
    expect(await readQuestion(post(JSON.stringify({ question: "x".repeat(2000) })))).toEqual({ ok: false, status: 413 });
  });
  it("stops reading an unbounded stream once the cap is passed", async () => {
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        pulled += 1;
        c.enqueue(new Uint8Array(512).fill(97));
        if (pulled > 1000) c.close();
      },
    });
    const req = new Request("https://x/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit);
    expect(await readQuestion(req)).toEqual({ ok: false, status: 413 });
    expect(pulled).toBeLessThan(20);
  });
  it("counts bytes, not characters", async () => {
    const q = "é".repeat(MAX_BODY_BYTES / 2); // 2 bytes each, over the cap once wrapped in JSON
    expect(await readQuestion(post(JSON.stringify({ question: q })))).toEqual({ ok: false, status: 413 });
  });
  it("accepts a well-formed question", async () => {
    expect(await readQuestion(post(JSON.stringify({ question: "what is keel" })))).toEqual({ ok: true, question: "what is keel" });
  });
});
