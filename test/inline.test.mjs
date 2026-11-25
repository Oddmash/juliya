import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { wrap } from "@oddmash/juliya";
import { WrapText } from "@oddmash/juliya/react";

test("range measurements distinguish repeated text in different styles", () => {
  const text = "가나 가나\n가나 가나";
  const lines = wrap(text, { width: 7, measure: (value) => value.length, measureRange: (start, end) => {
    let width = 0;
    for (let i = start; i < end; i++) width += i >= 3 && i < 5 ? 3 : 1;
    return width;
  } });
  assert.deepEqual(lines.map(({ text }) => text), ["가나 ", "가나", "가나 가나"]);
  assert.equal(lines.map(({ text, breakAfter }) => text + breakAfter).join(""), text);
});

test("nested inline JSX preserves tags, attributes and manual breaks on the server", () => {
  const html = renderToString(createElement(WrapText, { forcedBreaks: [3] },
    createElement("strong", null, "한국어", createElement("em", null, "줄바꿈")),
    createElement("br"), createElement("a", { href: "/docs", className: "link" }, "문서")));
  assert.match(html, /<strong>한국어<br data-kowrap-break=""\/?><em>줄바꿈<\/em><\/strong>/);
  assert.match(html, /<br\/?><a href="\/docs" class="link">문서<\/a>/);
});
