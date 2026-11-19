import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { WrapText } from "@oddmash/kowrap/react";
import { SentenceText } from "@oddmash/kowrap/react/server";
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

test("built React entry preserves the Next.js client boundary", () => {
  assert.match(readFileSync(new URL("../dist/react.js", import.meta.url), "utf8"), /^"use client";/);
  assert.doesNotMatch(readFileSync(new URL("../dist/server.js", import.meta.url), "utf8"), /^"use client";/);
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
