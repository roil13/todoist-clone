import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
const log = (...a) => console.log("•", ...a);
const isMac = process.platform === "darwin";

try {
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "demo@example.com");
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button:has-text("Log in")');
  await page.waitForURL("**/today", { timeout: 20000 });
  log("logged in as demo");

  // Open the Work project
  await page.click('a:has-text("Work")');
  await page.waitForURL("**/project/**", { timeout: 8000 });
  await page.waitForSelector("text=Write quarterly report", { timeout: 8000 });
  log("project list view renders");

  // Switch to Board
  await page.click('button:has-text("Board")');
  await page.waitForSelector("text=In progress", { timeout: 8000 });
  await page.waitForSelector("text=Review pull requests", { timeout: 8000 });
  log("board view renders columns");

  // Switch to Calendar
  await page.click('button:has-text("Calendar")');
  await page.waitForSelector("text=Mon", { timeout: 8000 });
  log("calendar view renders");

  // Command menu (Ctrl/Cmd+K)
  await page.keyboard.press(isMac ? "Meta+k" : "Control+k");
  await page.waitForSelector('input[placeholder^="Jump to"]', { timeout: 5000 });
  await page.fill('input[placeholder^="Jump to"]', "Upcoming");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/upcoming", { timeout: 8000 });
  log("command menu navigates");

  // Keyboard shortcut 'q' opens quick add
  await page.keyboard.press("q");
  await page.waitForSelector('input[placeholder^="Task name"]', { timeout: 5000 });
  log("'q' opens quick add");
  await page.keyboard.press("Escape");

  // Theme switch via settings
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
  await page.selectOption("select", "moonstone").catch(() => {});
  await page.waitForTimeout(300);
  const theme = await page.getAttribute("html", "data-theme");
  log("theme applied:", theme);

  await page.screenshot({ path: "scripts/p4.png", fullPage: true });
  log("screenshot saved");
} catch (e) {
  console.error("SMOKE FAILED:", e.message);
  await page.screenshot({ path: "scripts/p4-error.png", fullPage: true }).catch(() => {});
  errors.push("flow: " + e.message);
} finally {
  await browser.close();
}

console.log("\n=== console/page errors ===");
console.log(errors.length ? errors.join("\n") : "none");
process.exit(errors.some((e) => e.startsWith("flow:")) ? 1 : 0);
