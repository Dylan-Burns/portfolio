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
  for (const s of SLUGS) await expect(page.locator(`a[href="/work/${s}"]`).first()).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});

test("each project page renders with a launch action", async ({ page }) => {
  for (const s of SLUGS) {
    await page.goto(`/work/${s}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /launch app|app store/i }).first()).toBeVisible();
  }
});

test("unknown project slug shows the 404", async ({ page }) => {
  const res = await page.goto("/work/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /doesn.t exist/i })).toBeVisible();
});

test("resume link points at the PDF", async ({ page }) => {
  await page.goto("/");
  const resume = page.getByRole("link", { name: /resume/i }).first();
  await expect(resume).toHaveAttribute("href", /\.pdf$/);
});

test("nav anchor links work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Work", exact: true }).click(); // exact: don't also match the hero's "See my work →"
  await expect(page).toHaveURL(/#work$/);
});
