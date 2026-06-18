import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage();
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

  // Open global Add task modal and type NL — verify live preview chips
  await page.click('button:has-text("Add task") >> nth=0');
  await page.fill('input[placeholder^="Task name"]', "Email boss tomorrow #Work @urgent p2");
  await page.waitForSelector("text=P2", { timeout: 5000 });
  await page.waitForSelector("text=Work", { timeout: 5000 });
  await page.waitForSelector("text=urgent", { timeout: 5000 });
  log("smart quick-add preview chips render (P2, Work, urgent)");
  await page.keyboard.press("Escape");

  // Create a filter via /filters
  await page.goto("http://localhost:3000/filters", { waitUntil: "networkidle" });
  await page.click('button:has-text("Add filter")');
  await page.fill('input[placeholder="Filter name"]', "Hot list");
  await page.fill('input[placeholder^="Query"]', "today | overdue");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.waitForSelector("li:has-text('Hot list')", { timeout: 8000 });
  log("filter created");

  // Open it
  await page.click('a:has-text("Hot list")');
  await page.waitForURL("**/filter/**", { timeout: 8000 });
  await page.waitForSelector("text=today | overdue", { timeout: 8000 });
  log("filter view renders with query");

  await page.screenshot({ path: "scripts/p2.png", fullPage: true });
  log("screenshot saved scripts/p2.png");
} catch (e) {
  console.error("SMOKE FAILED:", e.message);
  await page.screenshot({ path: "scripts/p2-error.png", fullPage: true }).catch(() => {});
  errors.push("flow: " + e.message);
} finally {
  await browser.close();
}

console.log("\n=== console/page errors ===");
console.log(errors.length ? errors.join("\n") : "none");
process.exit(errors.some((e) => e.startsWith("flow:")) ? 1 : 0);
