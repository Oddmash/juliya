import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { JuliyaProvider, JuliyaText, useJuliya, WrapText, useKowrap } from "@oddmash/kowrap/react";
import { JuliyaSentenceText, SentenceText } from "@oddmash/kowrap/react/server";
import { createCanvasMeasure } from "@oddmash/kowrap/browser";

test("server renders original text with no DOM or canvas access", () => {
  assert.equal(typeof document, "undefined");
  const html = renderToString(createElement(WrapText, { as: "h1", className: "title" }, "자연스러운 한국어 줄바꿈"));
  assert.match(html, /^<h1 class="title"/);
  assert.match(html, /자연스러운 한국어 줄바꿈<\/h1>$/);
  assert.doesNotMatch(html, /<br/);
});

test("React escapes literal markup rather than injecting HTML", () => {
  const html = renderToString(createElement(WrapText, null, "<script>alert(1)</script>"));
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test("Juliya exports preserve the original React entrypoint identities", () => {
  assert.equal(WrapText, JuliyaText);
  assert.equal(useKowrap, useJuliya);
  assert.equal(SentenceText, JuliyaSentenceText);
});

test("JuliyaProvider shares a locale, supports nesting and allows explicit overrides", () => {
  const html = renderToString(createElement(JuliyaProvider, { locale: "ja" },
    createElement(JuliyaText, { as: "p" }, "日本語の文章"),
    createElement(WrapText, { as: "p", locale: "en" }, "Plain English"),
    createElement(JuliyaProvider, null, createElement(JuliyaText, { as: "p" }, "日本語の例")),
    createElement(JuliyaProvider, { locale: "zh" }, createElement(JuliyaText, { as: "p" }, createElement("strong", null, "中文示例"))),
  ));
  assert.match(html, /<p lang="ja"[^>]*>日本語の文章<\/p>/);
  assert.match(html, /<p lang="en"[^>]*>Plain English<\/p>/);
  assert.match(html, /<p lang="ja"[^>]*>日本語の例<\/p>/);
  assert.match(html, /<p lang="zh"[^>]*><strong>中文示例<\/strong><\/p>/);
  assert.doesNotMatch(renderToString(createElement(JuliyaText, null, "한글")), / lang=/);
});

test("Juliya hook resolves provider locale, explicit overrides and Korean default without DOM", () => {
  const Example = ({ locale }) => {
    const layout = useJuliya({ text: "日本語の文章", locale });
    return createElement("p", { lang: layout.locale }, layout.lines.map((line) => line.text).join(""));
  };
  const html = renderToString(createElement(JuliyaProvider, { locale: "ja" },
    createElement(Example), createElement(Example, { locale: "en" })));
  assert.equal(html, '<p lang="ja">日本語の文章</p><p lang="en">日本語の文章</p>');
  assert.equal(renderToString(createElement(Example)), '<p lang="ko">日本語の文章</p>');
});

test("manual breaks appear in initial SSR HTML before browser measurement", () => {
  const html = renderToString(createElement(WrapText, { forcedBreaks: [3] }, "한국어줄바꿈"));
  assert.match(html, /한국어<br\/?>(?:<!-- -->)?줄바꿈/);
  const sentenceHtml = renderToString(createElement(SentenceText, { forcedBreaks: [3] }, "한국어줄바꿈"));
  assert.match(sentenceHtml, /한국어<\/span><br\/?><span[^>]*>줄바꿈/);
});

test("built React entry preserves the Next.js client boundary", () => {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const entry = (path) => readFileSync(new URL(`../${manifest.exports[path].import.slice(2)}`, import.meta.url), "utf8");
  assert.match(entry("./react"), /^"use client";/);
  assert.doesNotMatch(entry("./react/server"), /^"use client";/);
});

test("sentence grouping works during SSR without a client effect", () => {
  const html = renderToString(createElement(SentenceText, { as: "p" }, "첫 문장입니다. 두 번째 문장입니다."));
  assert.match(html, /<span style="display:inline-block;max-width:100%">첫 문장입니다\.<\/span>/);
  assert.match(html, /<span style="display:inline-block;max-width:100%">두 번째 문장입니다\.<\/span>/);
});

test("browser measurement is lazy and accepts an injected document", () => {
  const context = { font: "", letterSpacing: "", wordSpacing: "", fontKerning: "auto", measureText: (text) => ({ width: text.length * 3 }) };
  const ownerDocument = { createElement: () => ({ getContext: () => context }) };
  const measure = createCanvasMeasure({ font: "16px sans-serif", letterSpacing: "1px", wordSpacing: "2px" }, ownerDocument);
  assert.equal(measure("한글"), 6);
  assert.equal(context.font, "16px sans-serif");
  assert.equal(context.letterSpacing, "1px");
});
