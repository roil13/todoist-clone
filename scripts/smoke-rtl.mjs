import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
const log = (...a) => console.log("•", ...a);

try {
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "demo@example.com");
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button:has-text("Log in"), button:has-text("התחברות")');
  await page.waitForURL("**/today", { timeout: 20000 });
  log("logged in (default English)");

  let dir = await page.getAttribute("html", "dir");
  log("initial dir:", dir);

  // Go to settings, switch to Hebrew
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
  // The first select is Language
  await page.selectOption("select", "he");
  await page.waitForFunction(() => document.documentElement.dir === "rtl", { timeout: 8000 });
  dir = await page.getAttribute("html", "dir");
  const lang = await page.getAttribute("html", "lang");
  log(`after switch -> dir=${dir} lang=${lang}`);

  // Nav text should be Hebrew now (sidebar is client, updates live)
  await page.waitForSelector("text=היום", { timeout: 8000 });
  await page.waitForSelector("text=הקרובים", { timeout: 8000 });
  log("sidebar shows Hebrew nav (היום / הקרובים)");

  // Sidebar should sit flush to the right edge in RTL (not pushed off-screen)
  const box = await (await page.$("aside")).boundingBox();
  const vw = page.viewportSize().width;
  const flushRight = Math.round(box.x + box.width) >= vw - 2 && box.x < vw;
  log(`sidebar right edge=${Math.round(box.x + box.width)} (viewport ${vw}); flush & on-screen=${flushRight}`);
  if (!flushRight) throw new Error("RTL sidebar not flush to right / off-screen");

  // Quick Add with Hebrew NL
  await page.keyboard.press("q");
  await page.waitForSelector('input[placeholder^="שם המשימה"]', { timeout: 5000 });
  await page.fill('input[placeholder^="שם המשימה"]', "דוח מחר 17:00 #עבודה p1 כל יום");
  await page.waitForSelector("text=P1", { timeout: 5000 });
  await page.waitForSelector("text=חוזר", { timeout: 5000 });
  log("Hebrew quick-add preview shows P1 + חוזר (recurring)");
  await page.keyboard.press("Escape");

  await page.screenshot({ path: "scripts/rtl.png", fullPage: true });

  // Switch back to English
  await page.selectOption("select", "en");
  await page.waitForFunction(() => document.documentElement.dir === "ltr", { timeout: 8000 });
  log("switched back to English -> dir=ltr");
} catch (e) {
  console.error("SMOKE FAILED:", e.message);
  await page.screenshot({ path: "scripts/rtl-error.png", fullPage: true }).catch(() => {});
  errors.push("flow: " + e.message);
} finally {
  await browser.close();
}

console.log("\n=== console/page errors ===");
console.log(errors.length ? errors.join("\n") : "none");
process.exit(errors.some((e) => e.startsWith("flow:")) ? 1 : 0);
