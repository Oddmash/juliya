import test from "node:test";
import assert from "node:assert/strict";
import { segmentSentences, splitLines, wrap } from "@oddmash/juliya";
import { lineCost } from "../dist/core/scoring.js";
import { portfolioCorpus } from "./fixtures/portfolio-prose.mjs";

const proportionalMeasure = (text) => [...text].reduce((width, char) => width + (/[가-힣]/u.test(char) ? 1 : char === " " ? 0.3 : 0.5), 0);

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

test("keeps Korean numerals with inflected counters when the same line count fits", () => {
  for (const [text, pair] of [
    ["2. 도메인 두 개로 시작하기", "두 개로"],
    ["2. 도메인 3 개로 시작하기", "3 개로"],
    ["3. 설정 세 가지를 살펴보기", "세 가지를"],
    ["2. 사용자 두 명이 참여하기", "두 명이"],
    ["2. 설정 한 단계씩 진행하기", "한 단계씩"],
  ]) {
    const width = 10;
    const lines = run(text, width, { measure: proportionalMeasure });
    assert.equal(reconstruct(lines), text);
    assert.equal(lines.length, 2);
    assert.ok(lines.every(line => line.width <= width));
    assert.ok(lines.some(line => line.text.includes(pair)), `${pair}: ${lines.map(line => line.text).join(" | ")}`);
  }
});

test("counting expressions can still split when the available width requires it", () => {
  const text = "두 개로 시작하기";
  for (const width of [1, 2, 3]) {
    const lines = run(text, width);
    assert.equal(reconstruct(lines), text);
    assert.ok(lines.every(line => line.width <= width));
  }
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

test("portfolio prose preserves technical phrases when a same-line-count layout can do so", () => {
  const text = portfolioCorpus[1];
  const lines = run(text, 40, { measure: proportionalMeasure });
  assert.equal(reconstruct(lines), text);
  assert.equal(lines.length, 5);
  assert.ok(lines.some((line) => line.text.includes("CSS import를")));
  assert.ok(lines.every((line) => line.width <= 40));
});

test("long Korean portfolio prose retains source, line count and width at varied widths", () => {
  for (const text of portfolioCorpus) {
    for (const width of [12, 15, 18, 22, 26, 30, 35, 40, 46, 55, 65]) {
      const options = { measure: proportionalMeasure };
      const balanced = run(text, width, options);
      const greedy = run(text, width, { ...options, strategy: "greedy" });
      assert.equal(reconstruct(balanced), text);
      assert.ok(balanced.length <= greedy.length);
      assert.ok(balanced.every((line) => line.width <= width));
      for (const line of balanced) assert.equal(line.text, text.slice(line.start, line.end));
    }
  }
});

test("technical phrase lookup treats inherited object names as ordinary words", () => {
  for (const text of ["constructor 가나 다라", "toString 가나 다라", "__proto__ 가나 다라"]) {
    assert.equal(reconstruct(run(text, 12)), text);
  }
});

test("balanced Korean wrapping preserves technical noun phrases within the same line budget", () => {
  const measure = value => [...value].reduce((sum, character) => sum + (/[가-힣]/u.test(character) ? 1 : 0.5), 0);
  const cases = [
    ["Node.js 20 이상과 호환되는 패키지 매니저를 사용하세요. 기존 TypeScript 프로젝트에서 실행합니다.", 24, "패키지 매니저를", 3],
    ["프로젝트의 패키지 매니저를 변경하세요. 기존 설정은 유지하세요.", 10, "패키지 매니저를", 4],
    ["소스 아키텍처 검사기와 TypeScript 계약 런타임을 결합합니다. 기존 설정을 사용합니다.", 11, "계약 런타임을", 5],
  ];
  for (const [text, width, phrase, count] of cases) {
    const lines = wrap(text, { width, measure, locale: "ko", strategy: "balanced" });
    assert.equal(lines.length, count);
    assert.equal(reconstruct(lines), text);
    assert.ok(lines.every(line => line.width <= width));
    assert.ok(lines.some(line => line.text.includes(phrase)));
  }
});


test("keeps Korean adverbial modifiers with predicates within the same line budget", () => {
  const text = "제목이 한 줄에 안 들어가는 건 괜찮습니다. 그런데 줄 끝에 단어가 어색하게 끊기거나 마지막 줄에 몇 글자만 남으면 같은 제목도 읽기 어렵습니다.";
  for (const width of [37, 40, 45, 50]) {
    const lines = run(text, width, { measure: proportionalMeasure });
    assert.equal(reconstruct(lines), text);
    assert.equal(lines.length, 2);
    assert.ok(lines.every(line => line.width <= width));
    assert.ok(lines.some(line => line.text.includes("어색하게 끊기거나")));
  }
  for (const width of [1, 3, 8, 16, 25, 37, 50, 100]) {
    const lines = run(text, width, { measure });
    const greedy = run(text, width, { strategy: "greedy" });
    assert.equal(reconstruct(lines), text);
    assert.ok(lines.length <= greedy.length);
    assert.ok(lines.every(line => line.width <= width));
  }
});


test("generalizes Korean adverbial preferences across different predicates", () => {
  for (const [text, width, pair] of [
    ["이 도구는 문장을 자연스럽게 보여주고 내용을 읽기 쉽게 만듭니다.", 22, "자연스럽게 보여주고"],
    ["이 기능은 결과를 정확하게 계산하고 화면에 표시합니다.", 20, "정확하게 계산하고"],
  ]) {
    const lines = run(text, width);
    assert.equal(reconstruct(lines), text);
    assert.equal(lines.length, 2);
    assert.ok(lines.every(line => line.width <= width));
    assert.ok(lines.some(line => line.text.includes(pair)));
  }
});


test("handles short Korean adverbials without leaking the preference to other locales", () => {
  const text = "이 도구는 문장을 읽기 쉽게 만듭니다. 끝까지 확인합니다.";
  const width = 16;
  const korean = run(text, width, { measure: proportionalMeasure });
  const explicitKorean = run(text, width, { measure: proportionalMeasure, locale: "ko" });
  const english = run(text, width, { measure: proportionalMeasure, locale: "en" });
  assert.equal(reconstruct(korean), text);
  assert.deepEqual(korean, explicitKorean);
  assert.equal(korean.length, english.length);
  assert.ok(korean.every(line => line.width <= width));
  assert.ok(korean.some(line => line.text.includes("쉽게 만듭니다.")));
  assert.ok(!english.some(line => line.text.includes("쉽게 만듭니다.")));
});

test("does not treat Korean object-particle nouns as predicate heads", () => {
  const text = "우리는 조용하게 문을 닫았다. 다음 내용을 본다.";
  const width = 11;
  const lines = run(text, width);
  assert.equal(reconstruct(lines), text);
  assert.ok(lines.every(line => line.width <= width));
  assert.ok(lines.some(line => line.text.includes("문을 닫았다.")));
  assert.ok(!lines.some(line => line.text.includes("조용하게 문을")));
});

test("does not protect dative or topic-marked nouns as predicates", () => {
  const neutral = (fragment, nextWord) => lineCost({ fragment, width: 8, emergency: false }, 8, false, nextWord, "ko");
  for (const [fragment, nextWord] of [
    ["친구에게", "전했다."],
    ["조용하게", "문은"],
    ["조용하게", "문제는"],
  ]) {
    assert.equal(neutral(fragment, nextWord), 0.06);
  }
  assert.ok(neutral("쉽게", "만듭니다.") > 0.06);
  assert.ok(neutral("쉽게,", "만듭니다.") < 0.06);
});

test("yields when an adverb-predicate pair cannot fit or crosses an explicit break", () => {
  const narrow = "쉽게 만듭니다.";
  const lines = run(narrow, 3);
  assert.equal(reconstruct(lines), narrow);
  assert.ok(lines.every(line => line.width <= 3));
  assert.ok(!lines.some(line => line.text.includes(narrow)));
  const explicit = "쉽게\n만듭니다.";
  const forced = run(explicit, 20);
  assert.equal(reconstruct(forced), explicit);
  assert.deepEqual(forced.map(line => line.text), ["쉽게", "만듭니다."]);
});

test("recognizes conservative Korean attributive predicate inflections", () => {
  const cost = (nextWord, locale = "ko") => lineCost({ fragment: "조용하게", width: 8, emergency: false }, 8, false, nextWord, locale);
  for (const head of ["비칠", "보일", "바꿀", "계산할", "변경된", "표시할"]) {
    assert.ok(cost(head) > 0.06, head);
    assert.equal(cost(head, "en"), 0.06);
  }
  for (const noun of ["문을", "비밀", "사실", "길", "물건", "사진", "시간"]) assert.equal(cost(noun), 0.06, noun);
});
