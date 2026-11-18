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
// The disk has two folders and one file at the top: the projects live in /apps, the text files in /usr.
const APPS = [...WORK_SLUGS, "mario"];
const USR = ["about", "principles", "dispatch", "contact"];
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
  await expect(page.locator("#files .file")).toHaveText([/\/apps$/, /\/usr$/, /\/games$/, /\.env$/]);
  await page.keyboard.press("Enter");                                  // into /apps
  for (const f of APPS) await expect(page.locator(`.file[href="#${f}"]`)).toBeVisible();
  await expect(page.locator(".t-prompt")).toContainText("~/apps");
  await page.keyboard.press("Escape");                                 // back to the top
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");                                  // into /usr
  for (const f of USR) await expect(page.locator(`.file[href="#${f}"]`)).toBeVisible();
  await page.locator('#files a[data-dir=".."]').click();
  await expect(page.locator("#files .file")).toHaveCount(4);
  await page.locator('#files a[data-dir="games"]').click();            // into /games
  await expect(page.locator("#files .file")).toHaveText([/\.\.\/$/, /snake$/, /pong$/]);
  await page.locator('#files a[data-game="snake"]').click();
  await expect(page.locator("#tGame")).toBeVisible();
  await page.keyboard.press("Escape");                                 // quits the game, back in /games
  await expect(page.locator(".t-prompt")).toContainText("~/games");
  await page.keyboard.type("cd apps");
  await page.keyboard.press("Enter");
  await expect(page.locator('.file[href="#keel"]')).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator("#g1")).toHaveClass(/\boff\b/);
});

test("arrows select, enter opens the project on the CRT, escape returns to the files", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Space");
  await screenOn(page);
  await page.keyboard.press("Enter");                                  // /apps
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".file.sel")).toHaveText(/watchtower/);
  await page.keyboard.press("Enter");
  await expect(page.locator("#tPage h2")).toHaveText("Watchtower");
  await expect(page).toHaveURL(/#watchtower$/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#files")).toBeVisible();
  await expect(page).not.toHaveURL(/#watchtower$/);
  await expect(page.locator(".file.sel")).toHaveText(/watchtower/);    // back in /apps, where it was opened from
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

test("the old project addresses open that project on the computer", async ({ page }) => {
  for (const s of ["keel", "parahealth", "steamhouse"]) {
    await page.goto(`/work/${s}`);
    await expect(page).toHaveURL(new RegExp(`/#${s}$`));
    await expect(page.locator("#tPage h2")).toBeVisible();
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
  await page.locator('#files a[data-dir="apps"]').tap();
  for (const f of APPS) await expect(page.locator(`.file[href="#${f}"]`)).toBeInViewport();
  await page.locator('#files a[data-dir=".."]').tap();
  await page.locator('#files a[data-dir="usr"]').tap();
  for (const f of USR) await expect(page.locator(`.file[href="#${f}"]`)).toBeInViewport();
  await ctx.close();
});

test("easter eggs: a hidden file, the rm clip, the vim trap and the video player", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Space");
  await screenOn(page);
  const run = async (cmd: string) => { await page.keyboard.type(cmd); await page.keyboard.press("Enter"); };
  await expect(page.locator('#files a[href="#env"]')).toHaveText(/\.env$/);
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
  await run("cat .env");
  await expect(page.locator("#tVideo")).toBeVisible();
  await expect(page.locator("#vFrame iframe")).toHaveAttribute("src", /player\.vimeo\.com/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#files")).toBeVisible();
  await expect(page.locator("#vFrame iframe")).toHaveCount(0);
});

test("developer easter eggs, and the video player's controls cannot be clicked", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Space");
  await screenOn(page);
  const run = async (cmd: string) => { await page.keyboard.type(cmd); await page.keyboard.press("Enter"); };
  await run("git log");
  await expect(page.locator("#tOut")).toContainText("create more than you consume");
  await run("man dylan");
  await expect(page.locator("#tOut")).toContainText("DYLAN(1)");
  await run("cowsay <img src=x onerror=alert(1)>");
  await expect(page.locator("#tOut img")).toHaveCount(0);
  await run("curl parrot.live");
  await expect(page.locator("#tOut")).toContainText("party parrot");
  await run("cat .env");
  await expect(page.locator("#tVideo")).toBeVisible();
  const before = await page.locator("#vPlay").boundingBox();
  for (const sel of ["#vPlay", "#vMute", '#vSide [data-cmd="ls"]']) {
    const box = (await page.locator(sel).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
  await expect(page.locator("#tVideo")).toBeVisible();          // close never landed
  expect((await page.locator("#vPlay").boundingBox())!.x).not.toBe(before!.x);   // it slid along its track instead
  await page.keyboard.press("Escape");
  await expect(page.locator("#files")).toBeVisible();
});

test("super mario bros is listed like the other projects and opens its page", async ({ page }) => {
  await page.goto("/#mario");
  await expect(page.locator("#tPage h2")).toHaveText("Super Mario Bros");
  await expect(page.locator('#tPage a[href="https://github.com/Dylan-Burns/Super-Mario-Bros"]')).toBeVisible();
  await expect(page.locator("#tPage .pg-shot img")).toHaveJSProperty("complete", true);
  await page.keyboard.press("Escape");
  await expect(page.locator('#files a[href="#mario"]')).toHaveText(/supermariobros\.jar$/);
});

test("timeline lists every project, and the header has the sound and full-screen controls", async ({ page }) => {
  await page.goto("/#timeline");
  await expect(page.locator("#tPage h2")).toHaveText("Timeline");
  await expect(page.locator("#tPage .tl p")).toHaveCount(10);
  await expect(page.locator("#tPage .tl p").first()).toContainText("Parahealth");
  await page.keyboard.press("Escape");
  await expect(page.locator(".t-prompt")).toContainText("guest@burnsOS: ~/usr$");
  await expect(page.locator("#fsBtn svg")).toBeVisible();
  await expect(page.locator("#sndBtn")).toHaveAttribute("aria-label", "Sound off");
  await page.locator("#sndBtn").click();
  await expect(page.locator("#sndBtn")).toHaveAttribute("aria-label", "Sound on");
});

test("with scripts off the page is a readable document; with them on that text is still there for screen readers", async ({ browser, page }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const plain = await ctx.newPage();
  await plain.goto("/");
  await expect(plain.getByRole("heading", { level: 1, name: "Dylan Burns" })).toBeVisible();
  await expect(plain.getByRole("heading", { level: 3 })).toHaveCount(10);
  await expect(plain.getByRole("heading", { level: 3, name: "Watchtower" })).toBeVisible();
  await ctx.close();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Dylan Burns" })).toBeAttached();   // in the accessibility tree
  const box = await page.locator("#plain").boundingBox();
  expect(box!.width).toBeLessThanOrEqual(2);                                                    // but not on screen
});

test("backspace on an empty prompt goes back, at every level", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Space");
  await screenOn(page);
  await expect(page.locator("#legend")).toContainText(/backspace/i);
  await page.keyboard.press("Enter");                                  // into /apps
  await expect(page.locator(".t-prompt")).toContainText("~/apps");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");                                  // open the first project
  await expect(page.locator("#tPage h2")).toBeVisible();
  await page.keyboard.press("Backspace");                              // page -> folder
  await expect(page.locator("#files")).toBeVisible();
  await expect(page.locator(".t-prompt")).toContainText("~/apps");
  await page.keyboard.press("Backspace");                              // folder -> top
  await expect(page.locator("#files .file")).toHaveCount(4);
  await page.keyboard.type("lsx");
  await page.keyboard.press("Backspace");                              // with text typed it just deletes a letter
  await expect(page.locator("#tBuf")).toHaveText("ls");
});

test("the watchtower demo runs on the screen and waits for a person to approve the rollback", async ({ page }) => {
  await page.goto("/#watchtower");
  await page.locator('#tPage [data-cmd="demo"]').click();
  const wt = page.locator("#tOut .wt");
  await expect(wt).toContainText("WATCHTOWER");
  await expect(wt).toContainText("payments");
  await page.keyboard.press("1");                                      // inject the bad deploy
  await expect(wt).toContainText("fault injected: bad deploy");
  await expect(wt).toContainText("ROOT CAUSE", { timeout: 40_000 });
  await expect(wt).toContainText("payments #88");
  await expect(wt).toContainText("red herring");
  await page.waitForTimeout(1500);
  await expect(wt).toContainText("ROOT CAUSE");                        // nothing happens until someone approves
  await page.keyboard.press("Enter");
  await expect(wt).toContainText("recovered.", { timeout: 20_000 });
  await page.keyboard.press("Backspace");                              // the page had enlarged the screen: the first press shrinks it
  await page.keyboard.press("Backspace");                              // the second leaves the demo
  await expect(page.locator("#files")).toBeVisible();
});
