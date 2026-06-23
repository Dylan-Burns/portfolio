import { describe, it, expect } from "vitest";
import { toFileItems } from "@/content/file-items";
import { projects } from "@/content/projects";

describe("toFileItems", () => {
  const items = toFileItems(projects);

  it("ends with a resume file", () => {
    const resume = items[items.length - 1];
    expect(resume.label).toMatch(/resume\.pdf/i);
    expect(resume.href).toBe("/resume");
  });

  it("emits a file for every project, in project order, ahead of the resume", () => {
    // standalone external links (e.g. parkli) may be interleaved, but every project
    // still appears, in order, before the trailing resume.
    const indices = projects.map((p) => items.findIndex((i) => i.name === p.name));
    expect(indices.every((n) => n >= 0)).toBe(true);
    expect(indices).toEqual([...indices].sort((a, b) => a - b)); // ascending → same order as `projects`
    expect(Math.max(...indices)).toBeLessThan(items.length - 1); // all sit before the resume
  });

  it("applies domain filename overrides while keeping every project linked to its /work page", () => {
    const cases = [
      { name: "Parahealth", href: "/work/parahealth", label: "parahealth.ai" },
      { name: "Claruss", href: "/work/claruss", label: "claruss.app" },
      { name: "Cartlords", href: "/work/cartlords", label: "cartlords.com" },
    ];
    for (const c of cases) {
      const item = items.find((i) => i.name === c.name)!;
      expect(item.href).toBe(c.href);
      expect(item.label).toBe(c.label);
    }
  });

  it("uses a short single-segment category comment", () => {
    const first = items[0];
    expect(first.comment.length).toBeGreaterThan(0);
    expect(first.comment).not.toMatch(/[·,/]/); // short tag, not the full category string
  });

  it("every item carries a name used for the warp destination label", () => {
    for (const it of items) expect(it.name.length).toBeGreaterThan(0);
  });
});
