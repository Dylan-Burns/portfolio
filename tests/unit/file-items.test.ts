import { describe, it, expect } from "vitest";
import { toFileItems } from "@/content/file-items";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

describe("toFileItems", () => {
  const items = toFileItems(projects, site);
  it("emits one file per project plus a resume file, in order", () => {
    expect(items.slice(0, projects.length).map((i) => i.href)).toEqual(projects.map((p) => `/work/${p.slug}`));
    const resume = items[items.length - 1];
    expect(resume.label).toMatch(/resume\.pdf/i);
    expect(resume.href).toBe("/resume");
  });
  it("labels project files <slug>.tsx with a short single-segment category comment", () => {
    const first = items[0];
    expect(first.label).toBe(`${projects[0].slug}.tsx`);
    expect(first.comment.length).toBeGreaterThan(0);
    expect(first.comment).not.toMatch(/[·,/]/); // short tag, not the full category string
  });
  it("every item carries a name used for the warp destination label", () => {
    for (const it of items) expect(it.name.length).toBeGreaterThan(0);
  });
});
