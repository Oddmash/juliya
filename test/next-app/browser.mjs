import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium, firefox, webkit } from "playwright";
import { portfolioCorpus } from "../fixtures/portfolio-prose.mjs";

const origin = "http://127.0.0.1:4319";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    ".",
    "--hostname",
    "127.0.0.1",
    "--port",
    "4319",
  ],
  { stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } },
);
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
  assert.match(
    await response.text(),
    /오늘은 모든 사람이 함께 자연스러운 한국어 줄바꿈/,
  );
  const dynamic = await fetch(`${origin}/dynamic`);
  assert.ok(dynamic.ok);
  assert.match(
    await dynamic.text(),
    /오늘은 모든 사람이 함께 자연스러운 한국어 줄바꿈/,
  );
  for (const engine of [chromium, firefox, webkit]) {
    browser = await engine.launch();
    const page = await browser.newPage({
      viewport: { width: 340, height: 800 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(origin);
    await page.locator("#title br").first().waitFor({ state: "attached" });
    const narrow = await page.locator("#title br").count();
    assert.equal(
      await page.locator("#title").textContent(),
      "오늘은 모든 사람이 함께 자연스러운 한국어 줄바꿈을 경험할 수 있습니다.",
    );
    assert.ok(
      await page
        .locator("#title")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    );
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForFunction(
      (before) => document.querySelectorAll("#title br").length < before,
      narrow,
    );
    await page.goto(`${origin}/dynamic`);
    await page.setViewportSize({ width: 340, height: 800 });
    const title = page.locator("#title");
    await title.locator("br").first().waitFor({ state: "attached" });
    for (const [fontFamily, fontSize] of [
      ["Arial, sans-serif", 17],
      ["serif", 23],
      ["monospace", 19],
    ]) {
      const natural = await title.evaluate(
        async (element, { fontFamily, fontSize }) => {
          Object.assign(element.style, {
            fontFamily,
            fontSize: `${fontSize}px`,
            boxSizing: "border-box",
            padding: "0 5.25px",
            border: "1px solid",
          });
          await document.fonts.ready;
          const sample = element.cloneNode(false);
          sample.removeAttribute("id");
          sample.textContent = element.textContent;
          Object.assign(sample.style, {
            position: "absolute",
            width: "max-content",
            whiteSpace: "nowrap",
            visibility: "hidden",
          });
          element.after(sample);
          const width = sample.getBoundingClientRect().width;
          sample.remove();
          element.style.width = `${width + 0.2}px`;
          return width;
        },
        { fontFamily, fontSize },
      );
      await page.waitForFunction(() => !document.querySelector("#title br"));
      await title.evaluate((element, width) => {
        element.style.width = `${width - 2}px`;
      }, natural);
      await title.locator("br").first().waitFor({ state: "attached" });
    }
    const prose = page.locator("[data-prose]");
    assert.equal(await prose.count(), portfolioCorpus.length);
    const comparison = [];
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      });
      for (let index = 0; index < portfolioCorpus.length; index++) {
        const paragraph = prose.nth(index);
        assert.equal(await paragraph.textContent(), portfolioCorpus[index]);
        const result = await paragraph.evaluate((element) => {
          const style = getComputedStyle(element);
          const copy = element.cloneNode(false);
          copy.removeAttribute("data-prose");
          copy.textContent = element.textContent;
          Object.assign(copy.style, { whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "anywhere", position: "absolute", visibility: "hidden", width: style.width });
          element.after(copy);
          const lineHeight = Number.parseFloat(style.lineHeight);
          const cssLines = Math.round(copy.getBoundingClientRect().height / lineHeight);
          copy.remove();
          return { lines: Math.round(element.getBoundingClientRect().height / lineHeight), cssLines, breaks: element.querySelectorAll("br").length, overflow: element.scrollWidth - element.clientWidth };
        });
        assert.ok(result.overflow <= 1, `Prose overflow at ${width}px: ${index}`);
        comparison.push({ width, index, ...result });
      }
    }
    assert.ok(comparison.some(({ breaks }) => breaks > 0));
    console.log(`${engine.name()}: ${comparison.length} portfolio prose samples, CSS lines=${comparison.reduce((sum, sample) => sum + sample.cssLines, 0)}, Kowrap lines=${comparison.reduce((sum, sample) => sum + sample.lines, 0)}`);
    assert.deepEqual(errors, []);
    console.log(
      `${engine.name()}: Next.js SSR, hydration, responsive wrapping and fractional width passed`,
    );
    await browser.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
