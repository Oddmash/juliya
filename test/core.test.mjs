import test from "node:test";
import assert from "node:assert/strict";
import { segmentSentences, splitLines, wrap } from "@oddmash/kowrap";

const measure = (text) => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
const run = (text, width, options = {}) => wrap(text, { width, measure, ...options });
const reconstruct = (lines) => lines.map(({ text, breakAfter }) => text + breakAfter).join("");

test("preserves complete Korean words and UTF-16 source ranges", () => {
  const text = "오늘의 날씨는 정말 좋습니다. 함께 산책하러 갈까요?";
  const lines = run(text, 12);
  assert.equal(reconstruct(lines), text);
  assert.ok(lines.length > 1);
  for (const line of lines) {
    assert.equal(line.text, text.slice(line.start, line.end));
    assert.ok(line.width <= 12);
    if (line.end < text.length) assert.ok(line.text.endsWith(" "));
  }
});

test("balanced strategy reduces uneven lines without adding a line", () => {
  const text = "하나 둘 셋 넷 다섯 여섯";
  const balanced = run(text, 6);
  const greedy = run(text, 6, { strategy: "greedy" });
  const score = (lines) => lines.reduce((sum, line) => sum + (6 - line.width) ** 2, 0);
  assert.equal(balanced.length, greedy.length);
  assert.ok(score(balanced) < score(greedy));
});

test("keeps demonstratives with the word they modify when feasible", () => {
  const lines = run("오늘은 모든 사람이 함께", 9);
  assert.ok(!lines.slice(0, -1).some((line) => line.text.trimEnd().endsWith("모든")));
});

test("keeps a Korean adjective with its noun without adding a line", () => {
  const text = "오늘은 모든 사람이 함께 자연스러운 한국어 줄바꿈을 경험할 수 있습니다.";
  const width = 23;
  const lines = run(text, width);
  assert.equal(reconstruct(lines), text);
  assert.equal(lines.length, 2);
  assert.ok(lines.every((line) => line.width <= width));
  assert.ok(lines.some((line) => line.text.includes("자연스러운 한국어")));
});

test("uses emergency grapheme boundaries without splitting emoji or combining marks", () => {
  const text = "👩‍💻🇰🇷e\u0301가나다";
  const lines = run(text, 2);
  assert.deepEqual(lines.map((line) => line.text), ["👩‍💻🇰🇷", "e\u0301가", "나다"]);
  assert.equal(reconstruct(lines), text);
});

test("can disable emergency word breaks", () => {
  const lines = run("superlongword 한글", 3, { breakLongWords: false });
  assert.equal(lines[0].text, "superlongword ");
  assert.ok(lines[0].width > 3);
});

test("preserves hard line breaks, tabs, repeated spaces and empty paragraphs", () => {
  const text = "  첫 줄\r\n\n두번째\t  줄\u2028";
  const lines = run(text, 7);
  assert.equal(reconstruct(lines), text);
  assert.ok(lines.some((line) => line.text === "" && line.breakAfter === "\n"));
  assert.equal(lines.at(-1).text, "");
});

test("keeps indentation without forcing a fitting word to overflow", () => {
  const text = "   가나";
  const lines = run(text, 2);
  assert.equal(reconstruct(lines), text);
  assert.ok(lines.every((line) => line.width <= 2));
});

test("does not break non-breaking spaces in normal wrapping", () => {
  const text = "앞 단어\u00a0연결 뒤";
  const lines = run(text, 5);
  assert.ok(lines.some((line) => line.text.includes("단어\u00a0연결")));
});

test("honors nonuniform proportional width measurement", () => {
  const proportional = (text) => [...text].reduce((sum, char) => sum + (char === "W" ? 3 : 1), 0);
  const lines = run("WW ii WW", 8, { measure: proportional });
  assert.equal(reconstruct(lines), "WW ii WW");
  assert.ok(lines.every((line) => line.width <= 8));
});

test("empty input, single overflowing grapheme, and invalid measurements", () => {
  assert.deepEqual(run("", 1), [{ text: "", start: 0, end: 0, width: 0, breakAfter: "" }]);
  assert.equal(run("가", 1, { measure: () => 3 })[0].width, 3);
  assert.throws(() => run("가", 0), RangeError);
  assert.throws(() => run("가", Infinity), RangeError);
  assert.throws(() => run("가", 4, { measure: () => NaN }), RangeError);
});

test("reconstructs text without loss for many widths and strategies", () => {
  const text = "한국어 문장과 English 문장을 함께 씁니다.  👩‍💻\n긴문자열테스트";
  for (const strategy of ["balanced", "greedy"]) {
    for (let width = 1; width <= 30; width++) {
      const lines = run(text, width, { strategy });
      assert.equal(reconstruct(lines), text);
      assert.ok(lines.every((line) => line.width <= width));
    }
  }
});

test("segments Korean and English sentences without discarding delimiters", () => {
  const text = "첫 문장입니다. 다음 문장입니다! Really? 네.";
  const segments = segmentSentences(text);
  assert.equal(segments.map((segment) => segment.text).join(""), text);
  assert.equal(segments.length, 4);
  assert.ok(segments.every((segment) => text.slice(segment.start, segment.end) === segment.text));
});

test("manual UTF-16 boundaries are preserved under every strategy and width", () => {
  const text = "한글 줄바꿈과 영어 문장";
  const offset = text.indexOf("영어");
  for (const strategy of ["balanced", "greedy"]) {
    for (const width of [3, 8, 100]) {
      const lines = run(text, width, { strategy, forcedBreaks: [offset, offset] });
      assert.equal(reconstruct(lines), text);
      assert.ok(lines.some((line) => line.end === offset));
    }
  }
  assert.deepEqual(splitLines(text, [offset]).map(({ text }) => text), [text.slice(0, offset), text.slice(offset)]);
});

test("forced breaks protect graphemes and do not duplicate explicit newlines", () => {
  const text = "가👩‍💻나\r\n다";
  assert.throws(() => run(text, 20, { forcedBreaks: [2] }), RangeError);
  assert.throws(() => splitLines(text, [0]), RangeError);
  assert.throws(() => splitLines(text, [text.length]), RangeError);
  const lines = splitLines(text, [1, text.indexOf("\r"), text.indexOf("다")]);
  assert.equal(reconstruct(lines), text);
  assert.deepEqual(lines.map((line) => line.text), ["가", "👩‍💻나", "다"]);
});

test("greedy visits only forward line candidates instead of all suffixes", () => {
  const text = Array.from({ length: 200 }, (_, index) => `단어${index}`).join(" ");
  let greedyCalls = 0;
  let balancedCalls = 0;
  const greedy = run(text, 30, { strategy: "greedy", measure: (value) => { greedyCalls++; return value.length; } });
  const balanced = run(text, 30, { measure: (value) => { balancedCalls++; return value.length; } });
  assert.equal(reconstruct(greedy), text);
  assert.equal(reconstruct(balanced), text);
  assert.ok(greedyCalls < balancedCalls / 2);
});
