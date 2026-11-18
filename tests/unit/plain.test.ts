import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// The home page is an interactive computer. Its plain-text twin (for search engines, screen readers and visitors with
// scripts off) is generated from the same data; these tests fail if someone edits the computer and forgets to regenerate it.
const html = readFileSync("public/burnsos.html", "utf8");
const plain = html.slice(html.indexOf("<!-- plain:start"), html.indexOf("<!-- plain:end -->"));

describe("plain-text version of the home page", () => {
  it("is up to date with the computer's own data", () => {
    expect(() => execFileSync("node", ["scripts/build-plain.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });
  it("names every project the computer lists", () => {
    const names = [...html.matchAll(/\{ slug: "[a-z]+", name: "([^"]+)"/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThanOrEqual(10);
    for (const n of names) expect(plain).toContain(`<h3>${n}</h3>`);
  });
  it("has one main heading, the about text, principles and contact links, and no link to a retired page", () => {
    expect(plain.match(/<h1>/g)).toHaveLength(1);
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    for (const h of ["About", "Projects", "Principles", "Contact"]) expect(plain).toContain(`<h2>${h}</h2>`);
    expect(plain).toContain("mailto:");
    expect(plain).toContain("https://github.com/Dylan-Burns");
    expect(plain).not.toMatch(/href="\/work\//);
  });
  it("is marked as scripted before the body renders, so the plain version never flashes", () => {
    expect(html.indexOf('classList.add("js")')).toBeLessThan(html.indexOf("<body"));
  });
});

describe("analytics on the home page", () => {
  it("never declares a global named va, which would overwrite the event queue", () => {
    expect(html).not.toMatch(/\b(var|let|const)\s+va\b/);
    expect(html).toContain("window.va = window.va || function");
  });
});
