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
  await expect(page.locator(".t-prompt")).toContainText("~/apps$");
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
  await expect(page.locator(".t-prompt")).toContainText("~/games$");
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
  await page.locator('#files a[data-dir="apps"]').tap();
  for (const f of APPS) await expect(page.locator(`.file[href="#${f}"]`)).toBeInViewport();
  await page.locator('#files a[data-dir=".."]').tap();
  await page.locator('#files a[data-dir="usr"]').tap();
  for (const f of USR) await expect(page.locator(`.file[href="#${f}"]`)).toBeInViewport();
  await ctx.close();
});

test("ask endpoint: off by default, guarded", async ({ request, baseURL }) => {
  const ok = await request.post("/api/ask", { data: { question: "what is keel" }, headers: { origin: baseURL! } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ kind: "off", sources: [] });
  expect(ok.headers()["cache-control"]).toContain("no-store");
  expect(ok.headers()["x-content-type-options"]).toBe("nosniff");
  expect((await request.post("/api/ask", { data: { question: "x" }, headers: { origin: "https://evil.example" } })).status()).toBe(403);
  expect((await request.get("/api/ask")).status()).toBe(405);
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

test.describe("ask command", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });
  const open = async (page: import("@playwright/test").Page) => {
    await page.goto("/");
    await page.keyboard.press("Space");
    await screenOn(page);
  };
  const run = async (page: import("@playwright/test").Page, cmd: string) => {
    await page.keyboard.type(cmd);
    await page.keyboard.press("Enter");
  };

  test("ask renders the answer as text with clickable sources", async ({ page }) => {
    await page.route("**/api/ask", (r) =>
      r.fulfill({ json: { kind: "answer", text: "Keel <b>answers</b> questions about SEC filings.", sources: [{ file: "keeldd.com", section: "summary", slug: "keel" }] } }),
    );
    await open(page);
    await run(page, "ask what is keel");
    await expect(page.locator("#tOut")).toContainText("Keel <b>answers</b> questions about SEC filings.");
    await expect(page.locator("#tOut b")).toHaveCount(0);
    await expect(page.locator('#tOut a[data-cmd="open keeldd.com"]')).toBeVisible();
    await expect(page.locator('#tOut a[href="/work/keel"]')).toBeVisible();
    await expect(page.locator('#tOut [aria-live="polite"]')).toHaveCount(1);
  });

  test("ask with no question lists examples, and a failed request shows a plain message", async ({ page }) => {
    await page.route("**/api/ask", (r) => r.abort());
    await open(page);
    await run(page, "ask");
    await expect(page.locator('#tOut a[data-cmd^="ask "]')).toHaveCount(4);
    await run(page, "ask what is keel");
    await expect(page.locator("#tOut")).toContainText("ask couldn't reach the server");
  });

  test("a deflection links to the contact file", async ({ page }) => {
    await page.route("**/api/ask", (r) =>
      r.fulfill({ json: { kind: "deflect", text: "I don't answer questions about employers, location or availability. For those, open contact.txt or reach Dylan on LinkedIn.", sources: [] } }),
    );
    await open(page);
    await run(page, "ask where does he work");
    await expect(page.locator('#tOut a[data-cmd="open contact.txt"]')).toBeVisible();
    await expect(page.locator('#tOut a[href^="https://www.linkedin.com/"]')).toBeVisible();
  });

  test("a hostile slug or file from the server never becomes markup", async ({ page }) => {
    let dialogs = 0;
    page.on("dialog", (d) => { dialogs++; void d.dismiss(); });
    await page.route("**/api/ask", (r) =>
      r.fulfill({ json: { kind: "answer", text: "ok", sources: [{ file: '"><img src=x onerror=alert(1)>', section: "s", slug: '"><img src=x onerror=alert(1)>' }] } }),
    );
    await open(page);
    await run(page, "ask what is keel");
    await expect(page.locator("#tOut")).toContainText("ok");
    await expect(page.locator("#tOut img")).toHaveCount(0);
    await expect(page.locator('#tOut a[href^="/work/"]')).toHaveCount(0);
    expect(dialogs).toBe(0);
  });

  test("429, off, and an over-long question are handled without inventing copy", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/ask", (r) => {
      calls++;
      return calls === 1
        ? r.fulfill({ status: 429, json: { kind: "busy", text: "x", sources: [] } })
        : r.fulfill({ json: { kind: "off", text: "Ask is not switched on yet.", sources: [] } });
    });
    await open(page);
    await run(page, "ask what is keel");
    await expect(page.locator("#tOut")).toContainText("Too many questions at once. Give it a minute.");
    await run(page, "ask what is keel again");
    await expect(page.locator("#tOut")).toContainText("Ask is not switched on yet.");
    await page.keyboard.type("ask");
    await page.locator("#tIn").evaluate((el, v) => { (el as HTMLInputElement).value = v; el.dispatchEvent(new Event("input")); }, "ask " + "a".repeat(301));
    await page.keyboard.press("Enter");
    await expect(page.locator("#tOut")).toContainText("too long");
    expect(calls).toBe(2);
  });

  test("a second ask is ignored while one is pending", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/ask", async (r) => {
      calls++;
      await new Promise((res) => setTimeout(res, 600));
      await r.fulfill({ json: { kind: "answer", text: "slow answer", sources: [] } });
    });
    await open(page);
    await run(page, "ask what is keel");
    await run(page, "ask what is parahealth");
    await expect(page.locator("#tOut")).toContainText("slow answer");
    expect(calls).toBe(1);
  });

  test("a late reply never lands on a different screen", async ({ page }) => {
    await page.route("**/api/ask", async (r) => {
      await new Promise((res) => setTimeout(res, 500));
      await r.fulfill({ json: { kind: "answer", text: "stale words", sources: [] } });
    });
    await open(page);
    await run(page, "ask what is keel");
    await run(page, "clear");
    await run(page, "help");
    await page.waitForTimeout(900);
    await expect(page.locator("#tOut")).not.toContainText("stale words");
  });
});

test.describe("ask command, animated", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });     // set explicitly: the option above otherwise carries over
  const LONG = "Keel answers questions about SEC filings with citations. ".repeat(12).trim();
  const reply = { kind: "deflect", text: LONG, sources: [{ file: "keeldd.com", section: "s", slug: "keel" }] };
  const open = async (page: import("@playwright/test").Page) => {
    await page.goto("/");
    await page.keyboard.press("Space");
    await screenOn(page);
  };
  const run = async (page: import("@playwright/test").Page, cmd: string) => {
    await page.keyboard.type(cmd);
    await page.keyboard.press("Enter");
  };

  test("starting another command mid-type still shows the full text and the sources", async ({ page }) => {
    await page.route("**/api/ask", (r) => r.fulfill({ json: reply }));
    await open(page);
    await run(page, "ask what is keel");
    await expect(page.locator("#tOut .ask-a")).not.toContainText("thinking");
    await expect(page.locator('#tOut a[data-cmd="open keeldd.com"]')).toHaveCount(0);
    await run(page, "help");
    await expect(page.locator("#tOut .ask-a")).toContainText(LONG);
    await expect(page.locator('#tOut a[data-cmd="open keeldd.com"]')).toBeVisible();
    await expect(page.locator('#tOut a[data-cmd="open contact.txt"]')).toBeVisible();
  });

  test("the live region holds only the full text, never partial text", async ({ page }) => {
    await page.route("**/api/ask", (r) => r.fulfill({ json: reply }));
    await open(page);
    await run(page, "ask what is keel");
    await expect(page.locator("#tOut .ask-a [aria-hidden=true]")).toHaveCount(1);
    await expect(page.locator("#tOut .ask-sr")).toHaveText("");
    await expect(page.locator("#tOut .ask-sr")).toHaveText(LONG, { timeout: 20000 });
  });

  test("leaving to the file list mid-type writes nothing more and throws nothing", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/api/ask", (r) => r.fulfill({ json: reply }));
    await open(page);
    await run(page, "ask what is keel");
    await expect(page.locator("#tOut .ask-a")).not.toContainText("thinking");
    await run(page, "ls");
    await expect(page.locator("#files")).toBeVisible();
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => document.body.innerText)).not.toContain("Keel answers questions");     // innerText: visible text only
    expect(errors).toEqual([]);
  });

  test("a request that never resolves is aborted and shows the failure line", async ({ page }) => {
    await page.clock.install();     // time still flows; fastForward jumps it past the page's 12 s timeout
    await page.route("**/api/ask", () => {});
    await open(page);
    await run(page, "ask what is keel");
    await expect(page.locator("#tOut .ask-a")).toContainText("thinking");
    await page.clock.fastForward(13000);
    await expect(page.locator("#tOut")).toContainText("ask couldn't reach the server", { timeout: 5000 });
  });

  test("a second ask while pending prints a note; a non-file source is never linked", async ({ page }) => {
    await page.route("**/api/ask", async (r) => {
      await new Promise((res) => setTimeout(res, 500));
      await r.fulfill({ json: { kind: "answer", text: "fine", sources: [{ file: "https://evil.example", section: "s" }] } });
    });
    await open(page);
    await run(page, "ask what is keel");
    await run(page, "ask what is parahealth");
    await expect(page.locator("#tOut")).toContainText("still thinking about the last one.");
    await expect(page.locator("#tOut")).toContainText("fine");
    await expect(page.locator('#tOut a[data-cmd*="evil"]')).toHaveCount(0);
  });

  test("whitespace-only reply text shows the failure line", async ({ page }) => {
    await page.route("**/api/ask", (r) => r.fulfill({ json: { kind: "answer", text: "   ", sources: [] } }));
    await open(page);
    await run(page, "ask what is keel");
    await expect(page.locator("#tOut")).toContainText("ask couldn't reach the server");
  });
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
