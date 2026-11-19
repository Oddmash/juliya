import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const origin = "http://127.0.0.1:4319";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", ".", "--hostname", "127.0.0.1", "--port", "4319"], { stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
let browser;
try {
  let response;
  for (let i = 0; i < 60; i++) {
    try {
      response = await fetch(origin);
      if (response.ok) break;
    } catch {}
    if (server.exitCode !== null) throw new Error("Next.js server exited");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(response?.ok, "Next.js server is ready");
  assert.match(await response.text(), /오늘은 모든 사람이 함께 자연스러운 한국어 줄바꿈/);
  const dynamic = await fetch(`${origin}/dynamic`);
  assert.ok(dynamic.ok);
  assert.match(await dynamic.text(), /오늘은 모든 사람이 함께 자연스러운 한국어 줄바꿈/);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 340, height: 800 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(origin);
  await page.locator("#title br").first().waitFor({ state: "attached" });
  const narrow = await page.locator("#title br").count();
  assert.equal(await page.locator("#title").textContent(), "오늘은 모든 사람이 함께 자연스러운 한국어 줄바꿈을 경험할 수 있습니다.");
  assert.ok(await page.locator("#title").evaluate((element) => element.scrollWidth <= element.clientWidth + 1));
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.waitForFunction((before) => document.querySelectorAll("#title br").length < before, narrow);
  assert.deepEqual(errors, []);
  console.log("Next.js SSR, hydration, and responsive wrapping passed");
} finally {
  await browser?.close();
  server.kill();
}
