import { test, expect } from "@playwright/test";
import { projects } from "../../src/content/projects";

// reduced-motion makes TransitionLink/WarpOverlay bypass the warp and navigate
// directly, so file clicks are deterministic (no async transition to await).
// In Playwright 1.60 reducedMotion is a browser-context option (not a top-level
// test option), so it must be set via contextOptions to stay type-safe.
test.use({ contextOptions: { reducedMotion: "reduce" } });

// Project pages that exist under /work — every project renders a detail page.
const WORK_SLUGS = ["parahealth", "watchtower", "remoteretros", "outpost", "syene", "keel", "claruss", "cartlords", "steamhouse"];
// Everything on the home page happens on the computer's screen. With reduced motion (set above) the
// zoom, the power-on and the "download" before a page opens are instant, so these stay deterministic.
const FILES = [...WORK_SLUGS, "about", "principles", "dispatch", "contact"];
const screenOn = (page: import("@playwright/test").Page) => expect(page.locator("#g1")).toHaveClass(/\bon\b/);

test("landing is the room and a powered-off computer (no console errors)", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("img", { name: /vintage computer/i })).toBeVisible();
  // the tube is dark and the terminal is not shown until the visitor steps up to it
  await expect(page.locator("#g1")).not.toHaveClass(/\bon\b/);
  await expect(page.locator("#t1")).toBeHidden();
  await expect(page.locator("#legend")).toContainText(/space/i);
  // the resume was removed from the site entirely
  await expect(page.locator('a[href="/resume"]')).toHaveCount(0);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("space zooms in, the screen powers on and lists every file", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Space");
  await screenOn(page);
  for (const f of FILES) await expect(page.locator(`.file[href="#${f}"]`)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator("#g1")).toHaveClass(/\boff\b/);
});

test("arrows select, enter opens the project on the CRT, escape returns to the files", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Space");
  await screenOn(page);
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".file.sel")).toHaveText(/watchtower/);
  await page.keyboard.press("Enter");
  await expect(page.locator("#tPage h2")).toHaveText("Watchtower");
  await expect(page).toHaveURL(/#watchtower$/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#files")).toBeVisible();
  await expect(page).not.toHaveURL(/#watchtower$/);
});

test("a #name deep link opens straight onto that page", async ({ page }) => {
  await page.goto("/#keel");
  await expect(page.locator("#tPage h2")).toHaveText("Keel");
  await expect(page.locator('#tPage a[href="https://keeldd.com"]')).toBeVisible();
});

test("the shell runs typed commands and starts a game", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Space");
  await screenOn(page);
  await page.keyboard.type("cat keel");
  await page.keyboard.press("Enter");
  await expect(page.locator("#tOut")).toContainText("Keel");
  await page.keyboard.type("snake");
  await page.keyboard.press("Enter");
  await expect(page.locator("#tGame")).toBeVisible();
});

test("a work page's home link lands back at the computer, already at the keyboard", async ({ page }) => {
  await page.goto("/work/keel");
  await page.getByRole("link", { name: "home" }).first().click();
  await expect(page).toHaveURL(/\/\?view=files$/);
  await screenOn(page);
  await expect(page.locator("#files")).toBeVisible();
});

test("each project page renders with a launch action", async ({ page }) => {
  test.setTimeout(120_000); // walks every /work page in one test
  for (const s of WORK_SLUGS) {
    await page.goto(`/work/${s}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Gated projects with `links: {}` (cartlords) render no launch button by design —
    // their case study leads with an embedded walkthrough instead.
    const links = projects.find((p) => p.slug === s)?.links ?? {};
    // Source-only projects lead with "View source".
    const hasLaunch = Boolean(links.live || links.app || links.demo || links.appStore);
    if (hasLaunch) {
      await expect(page.getByRole("link", { name: /\bapp\b|site|store|launch|demo/i }).first()).toBeVisible();
    } else if (links.source) {
      await expect(page.getByRole("link", { name: /view source/i }).first()).toBeVisible();
    }
  }
});

test("unknown project slug shows the 404", async ({ page }) => {
  const res = await page.goto("/work/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /doesn.t exist/i })).toBeVisible();
});

test("the old resume route and PDF are gone", async ({ page }) => {
  const res = await page.goto("/resume");
  expect(res?.status()).toBe(404);
  const pdf = await page.goto("/dylan-burns-resume.pdf");
  expect(pdf?.status()).toBe(404);
});

test("on a phone, a tap zooms in and every file fits on the glass", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  await page.locator("#m1").tap();
  await screenOn(page);
  for (const f of FILES) await expect(page.locator(`.file[href="#${f}"]`)).toBeInViewport();
  await ctx.close();
});

test("easter eggs: a hidden file, the rm clip, the vim trap and the video player", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Space");
  await screenOn(page);
  const run = async (cmd: string) => { await page.keyboard.type(cmd); await page.keyboard.press("Enter"); };
  await expect(page.locator('#files a[href="#secrets"]')).toHaveText(/secrets\.txt$/);
  await run("ls -a");
  await expect(page.locator("#tOut")).toContainText(".plan");
  await run("cat .plan");
  await expect(page.locator("#tOut")).toContainText("ls -a");
  await run("rm -rf /");
  await expect(page.locator("#tOut video.meme")).toBeVisible();
  await run("vim");
  await run("exit");
  await expect(page.locator("#tOut")).toContainText("Not an editor command");
  await run(":q");
  await expect(page.locator("#tOut")).toContainText("you got out");
  await run("cat secrets.txt");
  await expect(page.locator("#tVideo")).toBeVisible();
  await expect(page.locator("#vFrame iframe")).toHaveAttribute("src", /player\.vimeo\.com/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#files")).toBeVisible();
  await expect(page.locator("#vFrame iframe")).toHaveCount(0);
});
