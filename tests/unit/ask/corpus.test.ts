import { describe, it, expect } from "vitest";
import { detectProjects } from "@/lib/ask/aliases";
import { buildCorpus, EXTRA_PROJECTS, hasDomainShape, pageName, projectName } from "@/lib/ask/corpus";
import { projects } from "@/content/projects";
import { profile } from "@/content/profile";
import { readFileSync } from "node:fs";

const c = buildCorpus();
it("has one card per project (case studies plus the home page's extra projects) and unique ids", () => {
  expect(c.chunks.filter((k) => k.section === "card")).toHaveLength(projects.length + EXTRA_PROJECTS.length);
  expect(new Set(c.chunks.map((k) => k.id)).size).toBe(c.chunks.length);
});
it("chunks every published paragraph", () => {
  const keel = c.chunks.filter((k) => k.project === "keel");
  expect(keel.some((k) => k.id === "keel/outcomes/1" && k.text.includes("faithfulness 0.94"))).toBe(true);
});
it("holds out unconfirmed role and period", () => {
  for (const slug of ["remoteretros", "syene", "keel"]) {
    const card = c.chunks.find((k) => k.id === `${slug}/card/1`)!;
    expect(card.text).not.toMatch(/Builder|2026/);
  }
  expect(c.chunks.find((k) => k.id === "parahealth/card/1")!.text).toContain("Founder");
});
it("excludes image text and todo comments", () => {
  expect(c.chunks.some((k) => /TODO\(owner\)/.test(k.text))).toBe(false);
  const imageText = projects.flatMap((p) => [
    p.cover,
    ...p.screenshots,
    ...(p.tour ?? []).flatMap((t) => t.views),
    ...(p.marketingSite ? [p.marketingSite.image] : []),
  ]).flatMap((i) => [i.alt, i.caption].filter((x): x is string => !!x));
  expect(imageText.length).toBeGreaterThan(0);
  for (const t of imageText) expect(c.chunks.some((k) => k.text.includes(t))).toBe(false);
});
it("is stable", () => { expect(buildCorpus().hash).toBe(c.hash); });
it("profile text matches the terminal page word for word", () => {
  const html = readFileSync("public/burnsos.html", "utf8");
  for (const p of [...profile.about, ...profile.principles.flatMap((x) => [x.title, x.body])]) expect(html).toContain(p);
});

describe("fallback labels and domain-shaped text", () => {
  const corpus = buildCorpus();
  it("lists the chunks whose own text holds a domain-shaped string", () => {
    expect(corpus.chunks.filter((c) => hasDomainShape(c.text)).map((c) => c.id)).toEqual([
      "outpost/outcomes/2",
      "steamhouse/architecture/2",
    ]);
  });
  it("names pages by plain project or section name, never a domain-shaped label", () => {
    const byId = new Map(corpus.chunks.map((c) => [c.id, c]));
    expect(pageName(byId.get("outpost/summary/1")!)).toBe("the Outpost page");
    expect(pageName(byId.get("keel/card/1")!)).toBe("the Keel page");
    expect(pageName(byId.get("profile/about/1")!)).toBe("the about page");
    expect(pageName(byId.get("profile/principles/1")!)).toBe("the principles page");
    expect(corpus.chunks.filter((c) => hasDomainShape(pageName(c))).map((c) => c.id)).toEqual([]);
  });
});


describe("final fix wave: the corpus matches the home page's ten projects", () => {
  const html = readFileSync("public/burnsos.html", "utf8");
  const byId = new Map(c.chunks.map((k) => [k.id, k]));

  it("the home page and the corpus list the same projects", () => {
    const home = [...html.matchAll(/\{ slug: "([a-z]+)", name: "/g)].map((m) => m[1]).sort();
    expect(home).toHaveLength(10);
    expect([...new Set(c.chunks.filter((k) => k.section === "card").map((k) => k.project))].sort()).toEqual(home);
  });

  it("Super Mario Bros is in the corpus, from the home page entry only, with no case-study link", () => {
    const mario = c.chunks.filter((k) => k.project === "mario");
    expect(mario.map((k) => k.id)).toEqual(["mario/card/1", "mario/summary/1", "mario/outcomes/1", "mario/outcomes/2", "mario/outcomes/3", "mario/outcomes/4"]);
    for (const k of mario) {
      expect(k.file).toBe("supermariobros.jar");
      expect(k.slug).toBeUndefined();
    }
    expect(byId.get("mario/card/1")!.text).toBe(
      "Super Mario Bros (Game engine): A tribute rebuild of the classic platformer, written to learn how a game engine fits together. " +
        "Role: Engineer, 2022. Stack: Java, OpenJDK 19, Tiled map editor, Object-oriented design. Links: source code.",
    );
    // Every sentence of the summary and outcomes is copied from public/burnsos.html.
    for (const k of mario.filter((x) => x.section !== "card")) expect(html).toContain(k.text.replace(/^2D /, "").replace(/\.$/, ""));
    expect(projectName(mario[0])).toBe("Super Mario Bros");
    expect(pageName(mario[0])).toBe("the Super Mario Bros page");
  });

  it("a portfolio overview passage states how many projects there are", () => {
    expect(byId.get("profile/projects/1")!.text).toBe(
      "This portfolio lists ten projects: Parahealth, Watchtower, Remote Retro, Outpost, Syene, Keel, Claruss, Cartlords, Steamhouse and Super Mario Bros.",
    );
  });

  it.each([
    ["what is super mario bros", ["mario"]],
    ["tell me about the mario project", ["mario"]],
    ["what is supermariobros.jar", ["mario"]],
    ["what games has he built", ["mario"]],
    ["tell me about the platformer", ["mario"]],
  ])("detects %s", (q, want) => {
    expect(detectProjects(q)).toEqual(want);
  });

  it("no passage can close the prompt's delimiters", () => {
    expect(c.chunks.filter((k) => /<\/?(passages|question)>/i.test(k.text)).map((k) => k.id)).toEqual([]);
  });
});
