import { chromium } from "playwright";

const BASE = "http://localhost:3000/todoist-clone";
const errors = [];
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
const log = (...a) => console.log("•", ...a);

try {
  await page.goto(`${BASE}/today`, { waitUntil: "networkidle" });
  // Seed gate → app; sidebar shows the seeded Inbox.
  await page.waitForSelector("text=Inbox", { timeout: 15000 });
  log("app loaded + seeded (Inbox present) — pure local, no server");

  // Add a task via the Today inline composer (writes to IndexedDB).
  await page.click('button:has-text("Add task") >> nth=-1');
  await page.fill('input[placeholder^="Task name"]', "Local-first task p1");
  await page.click('button:has-text("Add task") >> nth=-1');
  await page.waitForSelector("text=Local-first task", { timeout: 8000 });
  log("task added (Dexie)");

  // Reload → persisted locally (no server).
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("text=Local-first task", { timeout: 8000 });
  log("task persisted across reload (IndexedDB)");

  // Complete it → drops off Today.
  const row = page.locator("div.group", { hasText: "Local-first task" }).first();
  await row.locator('button[aria-label="Mark complete"]').first().click();
  await page.waitForTimeout(1200);
  const remaining = await page.locator("text=Local-first task").count();
  log("after complete, remaining on Today:", remaining, "(expect 0)");

  await page.screenshot({ path: "scripts/local.png", fullPage: true });
} catch (e) {
  console.error("SMOKE FAILED:", e.message);
  await page.screenshot({ path: "scripts/local-error.png", fullPage: true }).catch(() => {});
  errors.push("flow: " + e.message);
} finally {
  await browser.close();
}
console.log("\n=== console/page errors ===");
console.log(errors.length ? errors.join("\n") : "none");
process.exit(errors.some((e) => e.startsWith("flow:")) ? 1 : 0);
