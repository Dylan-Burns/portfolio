import { it, expect } from "vitest";
import { buildCorpus } from "@/lib/ask/corpus";
import { projects } from "@/content/projects";
import { profile } from "@/content/profile";
import { readFileSync } from "node:fs";

const c = buildCorpus();
it("has one card per project and unique ids", () => {
  expect(c.chunks.filter((k) => k.section === "card")).toHaveLength(projects.length);
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
