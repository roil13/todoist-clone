import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
const log = (...a) => console.log("•", ...a);

try {
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "test@example.com");
  await page.fill('input[type="password"]', "secret123");
  await page.click('button:has-text("Log in")');
  await page.waitForURL("**/today", { timeout: 20000 });
  log("logged in");

  // Visit the new pages
  for (const [path, marker] of [
    ["/productivity", "Karma"],
    ["/activity", "Activity"],
    ["/settings", "Backup"],
  ]) {
    await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle" });
    await page.waitForSelector(`text=${marker}`, { timeout: 10000 });
    log(`${path} renders (saw "${marker}")`);
  }

  // Open a task and add a comment + a reminder via the detail modal
  await page.goto("http://localhost:3000/inbox", { waitUntil: "networkidle" });
  const commentBtn = page.locator('button[aria-label="Comments"]').first();
  if ((await commentBtn.count()) > 0) {
    await commentBtn.click({ force: true });
    await page.waitForSelector("text=Reminders", { timeout: 8000 });
    await page.fill('textarea[placeholder="Add a comment…"]', "Browser comment");
    await page.click('button:has-text("Comment")');
    await page.waitForSelector("text=Browser comment", { timeout: 8000 });
    log("comment added via task modal (Reminders section present)");
  } else {
    log("no inbox task to comment on (skipped)");
  }

  await page.screenshot({ path: "scripts/p3.png", fullPage: true });
  log("screenshot saved");
} catch (e) {
  console.error("SMOKE FAILED:", e.message);
  await page.screenshot({ path: "scripts/p3-error.png", fullPage: true }).catch(() => {});
  errors.push("flow: " + e.message);
} finally {
  await browser.close();
}

console.log("\n=== console/page errors ===");
console.log(errors.length ? errors.join("\n") : "none");
process.exit(errors.some((e) => e.startsWith("flow:")) ? 1 : 0);
