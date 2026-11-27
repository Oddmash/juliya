import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

export const corpus = JSON.parse(readFileSync(new URL("./fixtures.json", import.meta.url), "utf8"));
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export const graphemes = text => [...segmenter.segment(text)];
export const models = {
  monospace: text => graphemes(text).length,
  proportional: text => graphemes(text).reduce((sum, { segment }) => sum + (
    /\s/u.test(segment) ? 0.3 : /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Extended_Pictographic}]/u.test(segment) ? 1 : 0.55
  ), 0),
};

export const evaluate = (wrap, fixture, width, measure, strategy) => {
  const text = fixture.text;
  const start = performance.now();
  const lines = wrap(text, { width, measure, locale: fixture.locale, strategy });
  const durationMs = performance.now() - start;
  const offsets = new Set([0, text.length, ...graphemes(text).map(unit => unit.index)]);
  const slacks = lines.map(line => (width - line.width) / width);
  const mean = slacks.reduce((sum, slack) => sum + slack, 0) / lines.length;
  const slackDeviation = Math.sqrt(slacks.reduce((sum, slack) => sum + (slack - mean) ** 2, 0) / lines.length);
  const breaks = lines.slice(0, -1).filter(line => !line.breakAfter).map(line => line.end);
  const words = [...new Intl.Segmenter(fixture.locale === "zh" ? "zh-Hans" : fixture.locale, { granularity: "word" }).segment(text)].filter(word => word.isWordLike);
  const wordInteriorBreaks = breaks.filter(offset => words.some(word => word.index < offset && offset < word.index + word.segment.length)).length;
  let eligiblePreferredPhrases = 0;
  let splitPreferredPhrases = 0;
  for (const phrase of fixture.preferredPhrases ?? []) {
    if (measure(phrase) > width) continue;
    for (let index = text.indexOf(phrase); index >= 0; index = text.indexOf(phrase, index + phrase.length)) {
      eligiblePreferredPhrases++;
      if (breaks.some(offset => index < offset && offset < index + phrase.length)) splitPreferredPhrases++;
    }
  }
  return {
    id: fixture.id,
    locale: fixture.locale,
    split: fixture.split,
    width,
    strategy,
    lineCount: lines.length,
    restored: lines.map(line => line.text + line.breakAfter).join("") === text,
    ranges: lines.every((line, index) => (
      text.slice(line.start, line.end) === line.text && line.start === (index === 0 ? 0 : lines[index - 1].end + lines[index - 1].breakAfter.length)
    )),
    graphemeSafe: lines.every(line => offsets.has(line.start) && offsets.has(line.end)),
    overflow: Math.max(0, ...lines.map(line => line.width - width)),
    slackDeviation,
    wordInteriorBreaks,
    eligiblePreferredPhrases,
    splitPreferredPhrases,
    durationMs,
  };
};

