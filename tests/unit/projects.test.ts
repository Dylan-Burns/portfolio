import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

const PUBLIC = join(process.cwd(), "public");
const isAbsoluteUrl = (s: string) => {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
};
const publicFileExists = (p: string) => existsSync(join(PUBLIC, p.replace(/^\//, "")));

describe("project data", () => {
  it("has at least the four expected projects", () => {
    const slugs = projects.map((p) => p.slug);
    expect(slugs).toEqual(expect.arrayContaining(["parahealth", "claruss", "cartlords"]));
  });

  it("has unique slugs", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every project has required non-empty fields", () => {
    for (const p of projects) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.name.trim()).not.toBe("");
      expect(p.tagline.trim()).not.toBe("");
      expect(p.summary.trim()).not.toBe("");
      expect(p.role.trim()).not.toBe("");
      expect(p.period.trim()).not.toBe("");
      expect(["browser", "phone"]).toContain(p.frame);
      expect(p.stack.length).toBeGreaterThan(0);
      expect(p.outcomes.length).toBeGreaterThan(0);
      expect(p.problem.length).toBeGreaterThan(0);
      expect(p.whatIBuilt.length).toBeGreaterThan(0);
      // gallery needs at least one medium — screenshots, a video, or both
      expect(p.screenshots.length > 0 || Boolean(p.video), `${p.slug}: no gallery media`).toBe(true);
    }
  });

  it("every link is an absolute URL", () => {
    for (const p of projects) {
      for (const v of Object.values(p.links)) {
        if (v) expect(isAbsoluteUrl(v), `${p.slug}: ${v}`).toBe(true);
      }
    }
  });

  it("every image has alt text, positive dimensions, and an existing file", () => {
    const imgs = projects.flatMap((p) => [p.cover, ...p.screenshots, ...(p.marketingSite ? [p.marketingSite.image] : [])]);
    imgs.push(site.about.portrait);
    for (const img of imgs) {
      expect(img.alt.trim(), JSON.stringify(img)).not.toBe("");
      expect(img.width).toBeGreaterThan(0);
      expect(img.height).toBeGreaterThan(0);
      expect(publicFileExists(img.src), `missing file: ${img.src}`).toBe(true);
    }
  });

  it("video media (when present) has a self-hosted file or an embed URL", () => {
    for (const p of projects) {
      if (!p.video) continue;
      expect(p.video.src ?? p.video.embed, `${p.slug}: video needs src or embed`).toBeTruthy();
      if (p.video.src) expect(publicFileExists(p.video.src), `missing video: ${p.video.src}`).toBe(true);
      if (p.video.embed) expect(isAbsoluteUrl(p.video.embed), `bad embed: ${p.video.embed}`).toBe(true);
      if (p.video.poster) expect(publicFileExists(p.video.poster)).toBe(true);
    }
  });
});

describe("site config", () => {
  it("has a valid url, an email, an existing resume, and at least one social", () => {
    expect(isAbsoluteUrl(site.url)).toBe(true);
    expect(site.email).toMatch(/.+@.+\..+/);
    expect(publicFileExists(site.resumePath), `missing resume: ${site.resumePath}`).toBe(true);
    expect(site.socials.length).toBeGreaterThan(0);
    for (const s of site.socials) expect(isAbsoluteUrl(s.href)).toBe(true);
  });
});
