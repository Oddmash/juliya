import assert from "node:assert/strict";
import test from "node:test";
import { wrap } from "@oddmash/kowrap";
import * as ko from "@oddmash/kowrap/ko";
import * as en from "@oddmash/kowrap/en";
import * as ja from "@oddmash/kowrap/ja";
import * as zh from "@oddmash/kowrap/zh";

const measure = text => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
const scenarios = [
  ["ko", ko, "팀의 모든 문서를 한곳에서 관리하세요"],
  ["en", en, "Manage all your documents in one place."],
  ["ja", ja, "すべての文書を一か所で管理できます。"],
  ["zh-Hans", zh, "在同一个地方管理团队的所有文档。"],
];

for (const [locale, api, text] of scenarios) {
  test(`${locale}: explicit entrypoint, measured wrapping and source preservation`, () => {
    for (const width of [5, 9, 14]) {
      const options = { width, measure };
      const lines = api.wrap(text, options);
      assert.deepEqual(lines, wrap(text, { ...options, locale }));
      assert.equal(lines.map(line => line.text + line.breakAfter).join(""), text);
      assert.ok(lines.every(line => line.width <= width));
      assert.equal(lines[0].start, 0);
      assert.equal(lines.at(-1).end, text.length);
    }
  });
}

test("Korean remains the existing default", () => {
  const text = scenarios[0][2];
  assert.deepEqual(wrap(text, { width: 10, measure }), ko.wrap(text, { width: 10, measure }));
});

test("Japanese and Chinese avoid closing punctuation at line start", () => {
  for (const [api, text] of [[ja, "「読みやすい文章」を作ります。"], [zh, "「清晰的文本」，让阅读更自然。"]]) {
    const lines = api.wrap(text, { width: 5, measure });
    assert.equal(lines.map(line => line.text).join(""), text);
    assert.ok(lines.every(line => !/^[、。，」]/u.test(line.text)));
    assert.ok(lines.every(line => !/「$/u.test(line.text)));
  }
});

test("locale profiles keep graphemes and explicit breaks", () => {
  for (const [, api] of scenarios) {
    const text = "A👩‍💻B\nC";
    const lines = api.wrap(text, { width: 2, measure, forcedBreaks: [1] });
    assert.equal(lines.map(line => line.text + line.breakAfter).join(""), text);
    assert.ok(lines.some(line => line.end === 1));
    assert.ok(lines.every(line => !line.text.endsWith("\u200d")));
  }
});

test("English avoids ending a line on an article when the same number of lines fits", () => {
  const lines = en.wrap("Read the new guide now", { width: 9, measure });
  assert.deepEqual(lines.map(line => line.text.trim()), ["Read", "the new", "guide now"]);
});

test("CJK profiles preserve mixed Latin text and non-breaking spaces", () => {
  for (const api of [ja, zh]) {
    const text = "ReactのUIとTypeScript\u00a0APIを読む。";
    const lines = api.wrap(text, { width: 16, measure, breakLongWords: false });
    assert.equal(lines.map(line => line.text).join(""), text);
    assert.ok(lines.some(line => line.text.includes("TypeScript\u00a0API")));
  }
});
