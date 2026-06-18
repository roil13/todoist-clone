import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

const log = (...a) => console.log("•", ...a);

try {
  // 1. Login via UI
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "test@example.com");
  await page.fill('input[type="password"]', "secret123");
  await page.click('button:has-text("Log in")');
  await page.waitForURL("**/today", { timeout: 20000 });
  log("logged in, on /today");

  // 2. Verify hydration: sidebar shows projects (Work) fetched via React Query
  await page.waitForSelector('text=Work', { timeout: 10000 });
  log("sidebar hydrated (Work project visible)");

  // 3. Add a task via inline Add task
  await page.click('button:has-text("Add task") >> nth=-1');
  await page.fill('input[placeholder^="Task name"]', "Browser smoke task");
  await page.click('button:has-text("Add task") >> nth=-1');
  await page.waitForSelector("text=Browser smoke task", { timeout: 10000 });
  log("task added and rendered");

  // 4. Complete it (click the checkbox button next to the task)
  const task = page.locator("text=Browser smoke task").first();
  await task.scrollIntoViewIfNeeded();
  const row = page.locator("div.group", { hasText: "Browser smoke task" }).first();
  await row.locator('button[aria-label="Mark complete"]').first().click();
  await page.waitForTimeout(1500);
  const stillThere = await page.locator("text=Browser smoke task").count();
  log("after complete, task instances on Today:", stillThere, "(expect 0)");

  // 5. Toggle theme
  const themeBefore = await page.getAttribute("html", "data-theme");
  await page.click('button[aria-label="Toggle theme"]');
  await page.waitForTimeout(300);
  const themeAfter = await page.getAttribute("html", "data-theme");
  log(`theme toggled: ${themeBefore} -> ${themeAfter}`);

  await page.screenshot({ path: "scripts/today.png", fullPage: true });
  log("screenshot saved scripts/today.png");
} catch (e) {
  console.error("SMOKE FAILED:", e.message);
  await page.screenshot({ path: "scripts/error.png", fullPage: true }).catch(() => {});
  errors.push("flow: " + e.message);
} finally {
  await browser.close();
}

console.log("\n=== console/page errors ===");
console.log(errors.length ? errors.join("\n") : "none");
process.exit(errors.length ? 1 : 0);
