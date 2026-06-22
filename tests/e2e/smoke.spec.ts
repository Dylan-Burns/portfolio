import { test, expect } from "@playwright/test";

const SLUGS = ["parahealth", "claruss", "wedding", "grocery"];

test("home page renders without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /see my work/i })).toBeVisible();
  // The spotlight carousel renders the active project as a /work/<slug> link; all four
  // projects are reachable via its tablist (non-active cards are buttons until selected).
  await expect(page.locator('a[href^="/work/"]').first()).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(SLUGS.length);
  // the decorative particle field mounts as an aria-hidden canvas behind content
  await expect(page.locator("canvas[aria-hidden]")).toHaveCount(1);
  // content remains clickable above the canvas (canvas is pointer-events-none)
  await page.getByRole("link", { name: /see my work/i }).click();
  await expect(page).toHaveURL(/#work$/);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("each project page renders with a launch action", async ({ page }) => {
  for (const s of SLUGS) {
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
  // The nav "Résumé" link goes to the /resume viewer page, which offers the PDF download.
  await page.goto("/");
  await expect(page.getByRole("link", { name: /résumé|resume/i }).first()).toHaveAttribute("href", "/resume");
  await page.goto("/resume");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /download pdf/i })).toHaveAttribute("href", /\.pdf$/);
});

test("nav anchor links work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Work", exact: true }).click(); // exact: don't also match the hero's "See my work →"
  await expect(page).toHaveURL(/#work$/);
});
