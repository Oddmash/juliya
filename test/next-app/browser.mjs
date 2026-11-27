import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
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
    await page.route(`${origin}/__juliya-inline-test`, (route) => route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: '<!doctype html><meta charset="utf-8"><p id="inline" style="width: 140px; font: 20px Arial; word-break: keep-all">읽기 좋은 <strong>한국어 줄바꿈</strong>을 경험해 보세요.<br>문서의 내용을 읽어 보세요.</p><p id="font" style="width: 240px; font: 20px Arial">Typography and line breaking for readable Korean 한국어 documents.</p><div id="after-font">After text</div>',
    }));
    await page.route(`${origin}/__juliya-dist/**`, async (route) => {
      const path = new URL(route.request().url()).pathname.slice("/__juliya-dist/".length);
      await route.fulfill({
        contentType: "text/javascript",
        body: await readFile(new URL(`../../dist/${path}`, import.meta.url)),
      });
    });
    let releaseFont;
    const fontGate = new Promise((resolve) => { releaseFont = resolve; });
    await page.route(`${origin}/__juliya-slow-font.woff2`, async (route) => {
      await fontGate;
      await route.fulfill({
        contentType: "font/woff2",
        body: await readFile(new URL("../../site/app/fonts/geist-mono-ascii.woff2", import.meta.url)),
      });
    });
    await page.goto(`${origin}/__juliya-inline-test`);
    const adverbial = await page.evaluate(async () => {
      const { wrap } = await import("/__juliya-dist/index.js");
      const text = "제목이 한 줄에 안 들어가는 건 괜찮습니다. 그런데 줄 끝에 단어가 어색하게 끊기거나 마지막 줄에 몇 글자만 남으면 같은 제목도 읽기 어렵습니다.";
      await document.fonts.ready;
      const context = document.createElement("canvas").getContext("2d");
      const results = [];
      for (const font of ["16px sans-serif", "18px serif", "20px sans-serif"]) {
        context.font = font;
        const measure = (value) => context.measureText(value).width;
        for (const width of [320, 390, 693, 900]) {
          const lines = wrap(text, { width, measure, locale: "ko" });
          const greedy = wrap(text, { width, measure, locale: "ko", strategy: "greedy" });
          results.push({
            font, width,
            restored: lines.map(line => line.text + line.breakAfter).join("") === text,
            fits: lines.every(line => line.width <= width),
            lineBudget: lines.length <= greedy.length,
            paired: lines.some(line => line.text.includes("어색하게 끊기거나")),
          });
        }
      }
      return results;
    });
    for (const sample of adverbial) {
      assert.ok(sample.restored && sample.fits && sample.lineBudget, JSON.stringify(sample));
    }
    const inline = await page.evaluate(async () => {
      const { mountKowrap } = await import("/__juliya-dist/dom/index.js");
      const element = document.querySelector("#inline");
      const text = element.textContent;
      const strong = element.querySelector("strong");
      const manual = element.querySelector("br");
      const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await frames();
      const controller = mountKowrap(element, { inline: true, locale: "ko" });
      await document.fonts.ready;
      await frames();
      const generated = [...element.querySelectorAll("[data-kowrap-break]")];
      const records = new MutationObserver(() => {});
      records.observe(element, { childList: true, characterData: true, subtree: true });
      const selection = document.getSelection();
      const selectedNode = element.firstChild;
      selection.setBaseAndExtent(selectedNode, 0, selectedNode, 1);
      const selected = selection.toString();
      const textMutations = () => records.takeRecords().filter((record) => record.type === "characterData" || [...record.addedNodes, ...record.removedNodes].some((node) => node.nodeType === Node.TEXT_NODE)).length;
      controller.refresh();
      const refreshMutations = textMutations();
      const metadata = {};
      metadata.self = metadata;
      controller.update({ inline: true, locale: "ko", metadata });
      const updateMutations = textMutations();
      const selectionPreserved = selection.anchorNode === selectedNode && selection.toString() === selected;
      selection.removeAllRanges();
      element.style.minHeight = "400px";
      await frames();
      const stable = generated.every((node) => node.isConnected);
      element.style.minHeight = "";
      await frames();
      const stylesheet = document.createElement("style");
      stylesheet.textContent = "body[data-large] #inline strong { font-size: 48px; }";
      document.head.append(stylesheet);
      const originalHeight = element.clientHeight;
      document.body.setAttribute("data-large", "");
      await frames();
      const descendantChanged = element.clientHeight > originalHeight && generated.some((node) => !node.isConnected);
      document.body.removeAttribute("data-large");
      stylesheet.remove();
      element.style.width = "800px";
      await frames();
      const wide = element.querySelectorAll("[data-kowrap-break]").length;
      controller.destroy();
      records.disconnect();
      return { count: generated.length, refreshMutations, updateMutations, selectionPreserved, descendantChanged, stable, wide, preserved: element.textContent === text && element.querySelector("strong") === strong && element.querySelector("br") === manual };
    });
    assert.ok(inline.count > 0);
    assert.equal(inline.refreshMutations, 0);
    assert.equal(inline.updateMutations, 0);
    assert.ok(inline.stable);
    assert.ok(inline.selectionPreserved);
    assert.ok(inline.descendantChanged);
    assert.ok(inline.wide < inline.count);
    assert.ok(inline.preserved);
    const authorStyle = await page.evaluate(async () => {
      const { mountKowrap } = await import("/__juliya-dist/dom/index.js");
      const stylesheet = document.createElement("style");
      stylesheet.textContent = ".selector-fixture > a:first-child { font-size: 40px; }";
      document.head.append(stylesheet);
      const create = () => {
        const element = document.createElement("p");
        element.className = "selector-fixture";
        element.style.cssText = "width: 180px; font: 16px Arial";
        element.append("Lead ", Object.assign(document.createElement("a"), { textContent: "Wide link with words" }), " and other text");
        document.body.append(element);
        return element;
      };
      const offsets = (element) => [...element.querySelectorAll("[data-kowrap-break]")].map((br) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        range.setEndBefore(br);
        return range.toString().length;
      });
      const element = create();
      const before = getComputedStyle(element.querySelector("a")).fontSize;
      const mounted = mountKowrap(element, { inline: true, locale: "en", forcedBreaks: [5] });
      const withBreak = getComputedStyle(element.querySelector("a")).fontSize;
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const initial = offsets(element);
      stylesheet.textContent = ".selector-fixture > a:first-child { font-size: 52px; }";
      mounted.update({ inline: true, locale: "en", forcedBreaks: [5] });
      const refreshed = offsets(element);
      const freshForced = create();
      const freshForcedMount = mountKowrap(freshForced, { inline: true, locale: "en", forcedBreaks: [5] });
      const expectedRefresh = offsets(freshForced);
      stylesheet.textContent = ".selector-fixture > a:first-child { font-size: 40px; }";
      mounted.refresh();
      const widthBeforeResize = element.clientWidth;
      stylesheet.textContent = ".selector-fixture > a:first-child { font-size: 52px; }";
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const beforeResize = offsets(element);
      window.dispatchEvent(new Event("resize"));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const resized = offsets(element);
      const widthAfterResize = element.clientWidth;
      freshForcedMount.destroy();
      freshForced.remove();
      mounted.update({ inline: true, locale: "en" });
      const actual = offsets(element);
      const fresh = create();
      const freshMount = mountKowrap(fresh, { inline: true, locale: "en" });
      const expected = offsets(fresh);
      mounted.destroy();
      freshMount.destroy();
      element.remove();
      fresh.remove();
      stylesheet.remove();
      return { before, withBreak, actual, expected, initial, refreshed, expectedRefresh, beforeResize, resized, widthBeforeResize, widthAfterResize };
    });
    assert.equal(authorStyle.before, "40px");
    assert.equal(authorStyle.withBreak, "16px");
    assert.deepEqual(authorStyle.actual, authorStyle.expected);
    assert.deepEqual(authorStyle.refreshed, authorStyle.expectedRefresh);
    assert.notDeepEqual(authorStyle.initial, authorStyle.expectedRefresh);
    assert.deepEqual(authorStyle.beforeResize, authorStyle.initial);
    assert.notDeepEqual(authorStyle.beforeResize, authorStyle.expectedRefresh);
    assert.equal(authorStyle.widthAfterResize, authorStyle.widthBeforeResize);
    assert.deepEqual(authorStyle.resized, authorStyle.expectedRefresh);
    const beforeFont = await page.evaluate(async () => {
      const { mountKowrap } = await import("/__juliya-dist/dom/index.js");
      const element = document.querySelector("#font");
      const font = new FontFace("DelayedFixture", "url(/__juliya-slow-font.woff2)");
      document.fonts.add(font);
      element.style.fontFamily = "DelayedFixture, Arial";
      const snapshots = [];
      const shifts = [];
      const snapshot = () => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const lines = new Set();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (let i = 0; i < node.length; i++) {
            const range = document.createRange();
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            lines.add(Math.round(range.getBoundingClientRect().top));
          }
        }
        return { lines: [...lines], after: Math.round(document.querySelector("#after-font").getBoundingClientRect().top) };
      };
      let observer;
      if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
        observer = new PerformanceObserver((list) => shifts.push(...list.getEntries().map(({ value }) => value)));
        observer.observe({ type: "layout-shift", buffered: true });
      }
      const sample = () => {
        snapshots.push(snapshot());
        frame = requestAnimationFrame(sample);
      };
      let frame = requestAnimationFrame(sample);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const native = snapshot();
      const offsets = (target) => [...target.querySelectorAll("[data-kowrap-break]")].map((br) => {
        const range = document.createRange();
        range.selectNodeContents(target);
        range.setEndBefore(br);
        return range.toString().length;
      });
      const controller = mountKowrap(element, { inline: true, locale: "en" });
      const fallback = offsets(element);
      const loaded = font.load();
      window.finishFontFixture = async () => {
        await loaded;
        await document.fonts.ready;
        const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await frames();
        const actual = offsets(element);
        const fresh = element.cloneNode(false);
        fresh.removeAttribute("id");
        fresh.textContent = element.textContent;
        element.after(fresh);
        const freshMount = mountKowrap(fresh, { inline: true, locale: "en" });
        const expected = offsets(fresh);
        freshMount.destroy();
        fresh.remove();
        element.style.width = "180px";
        element.style.fontSize = "22px";
        element.style.width = "480px";
        await frames();
        const final = snapshot();
        await frames();
        const stable = JSON.stringify(snapshot()) === JSON.stringify(final);
        cancelAnimationFrame(frame);
        observer?.disconnect();
        controller.destroy();
        return { snapshots, shifts, native, final, stable, fallback, actual, expected };
      };
      return { native, loading: font.status === "loading" };
    });
    releaseFont();
    assert.ok(beforeFont.loading);
    const fontResult = await page.evaluate(() => window.finishFontFixture());
    assert.ok(fontResult.stable);
    assert.notDeepEqual(fontResult.fallback, fontResult.expected);
    assert.deepEqual(fontResult.actual, fontResult.expected);
    assert.ok(fontResult.snapshots.length >= 3);
    console.log(`${engine.name()}: delayed font layout samples ${JSON.stringify(fontResult)}`);
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
