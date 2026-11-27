import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { boundariesOf, candidatesFrom } from "../../dist/core/boundaries.js";
import { segmentsWithBreaks } from "../../dist/core/segmentation.js";

export const corpus = JSON.parse(readFileSync(new URL("./fixtures.json", import.meta.url), "utf8"));
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export const graphemes = text => [...segmenter.segment(text)];
export const models = {
  monospace: text => graphemes(text).length,
  proportional: text => graphemes(text).reduce((sum, { segment }) => sum + (
    /\s/u.test(segment) ? 0.3 : /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Extended_Pictographic}]/u.test(segment) ? 1 : 0.55
  ), 0),
};

export const validatePreferredPhrases = fixture => {
  const phrases = fixture.preferredPhrases;
  if (phrases === undefined) return;
  if (fixture.split !== "development" || !Array.isArray(phrases) || phrases.some(phrase => typeof phrase !== "string" || phrase.length === 0 || !fixture.text.includes(phrase))) {
    throw new TypeError(`Invalid preferred phrase annotations for ${fixture.id}`);
  }
};

// An independent shortest-path objective over legal engine candidates, with
// annotated boundaries forbidden. No linguistic penalty or layout score is used.
export const minimumLinesKeeping = (text, width, measure, locale, ranges) => {
  let count = 0;
  const options = { width, measure, locale, breakLongWords: true };
  for (const paragraph of segmentsWithBreaks(text)) {
    const points = boundariesOf(paragraph.text, options);
    const last = points.length - 1;
    const counts = Array(points.length).fill(Infinity);
    counts[last] = 0;
    for (let start = last - 1; start >= 0; start--) {
      for (const candidate of candidatesFrom(paragraph.text, points, start, options)) {
        const offset = paragraph.start + points[candidate.next].offset;
        if (candidate.width > width || ranges.some(range => range.start < offset && offset < range.end)) continue;
        counts[start] = Math.min(counts[start], 1 + counts[candidate.next]);
      }
    }
    if (paragraph.breakAfter && ranges.some(range => range.start < paragraph.start + paragraph.text.length && paragraph.start + paragraph.text.length < range.end)) return Infinity;
    count += Math.max(1, counts[0]);
  }
  return count;
};

export const evaluate = (wrap, fixture, width, measure, strategy) => {
  validatePreferredPhrases(fixture);
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
  let feasiblePreferredPhrases = 0;
  let avoidablePhraseSplits = 0;
  const phraseObservations = [];
  for (const phrase of fixture.preferredPhrases ?? []) {
    if (measure(phrase) > width) continue;
    for (let index = text.indexOf(phrase); index >= 0; index = text.indexOf(phrase, index + phrase.length)) {
      eligiblePreferredPhrases++;
      const end = index + phrase.length;
      const splitOffsets = breaks.filter(offset => index < offset && offset < end);
      const split = splitOffsets.length > 0;
      if (split) splitPreferredPhrases++;
      const feasible = !split || minimumLinesKeeping(text, width, measure, fixture.locale, [{ start: index, end }]) <= lines.length;
      if (feasible) feasiblePreferredPhrases++;
      if (split && feasible) avoidablePhraseSplits++;
      phraseObservations.push({ start: index, end, splitOffsets, feasible, annotationStatus: "provisional" });
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
    feasiblePreferredPhrases,
    avoidablePhraseSplits,
    phraseObservations,
    durationMs,
  };
};
