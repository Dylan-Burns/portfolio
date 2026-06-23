import { test, expect } from "@playwright/test";

// reduced-motion makes TransitionLink/WarpOverlay bypass the warp and navigate
// directly, so file clicks are deterministic (no async transition to await).
// In Playwright 1.60 reducedMotion is a browser-context option (not a top-level
// test option), so it must be set via contextOptions to stay type-safe.
test.use({ contextOptions: { reducedMotion: "reduce" } });

// Project pages that exist under /work — every project renders a detail page.
const WORK_SLUGS = ["parahealth", "claruss", "cartlords"];
// Every CRT project file links to its own /work case study (label is the bare domain).
const LANDING_HREFS = WORK_SLUGS.map((s) => `/work/${s}`);

test("landing renders the machine and project files (no console errors)", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  // chassis image present (next/image encodes the src, so match by alt text, not path)
  await expect(page.getByRole("img", { name: /micro-computer/i })).toBeVisible();
  for (const href of LANDING_HREFS) await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
  await expect(page.locator('a[href="/resume"]')).toHaveCount(1);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("a project file navigates to its page", async ({ page }) => {
  await page.goto("/");
  // reduced-motion → TransitionLink falls back to direct nav.
  await page.locator('a[href="/work/cartlords"]').click();
  await expect(page).toHaveURL(/\/work\/cartlords$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("each project page renders with a launch action", async ({ page }) => {
  for (const s of WORK_SLUGS) {
    await page.goto(`/work/${s}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /\bapp\b|site|store|launch|demo/i }).first()).toBeVisible();
  }
});

test("unknown project slug shows the 404", async ({ page }) => {
  const res = await page.goto("/work/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /doesn.t exist/i })).toBeVisible();
});

test("resume page surfaces the PDF", async ({ page }) => {
  // The CRT "Résumé" file is a real <a href="/resume"> that opens the viewer page.
  await page.goto("/");
  await expect(page.getByRole("link", { name: /résumé|resume/i }).first()).toHaveAttribute("href", "/resume");
  await page.goto("/resume");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /download pdf/i })).toHaveAttribute("href", /\.pdf$/);
});
