import type { TextSegment, WrappedLine } from "./types.js";

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const breakableSpace = /[ \t\f\v\u2000-\u2006\u2008-\u200a\u205f\u3000]/u;
const trailingSpace = /[ \t\f\v\u2000-\u2006\u2008-\u200a\u205f\u3000]+$/u;
const hardBreak = /\r\n|[\r\n\u2028\u2029]/gu;

export const graphemesOf = (text: string) => Array.from(graphemeSegmenter.segment(text));
export const wordBoundariesOf = (text: string, locale: string) => {
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  return new Set(Array.from(segmenter.segment(text), ({ index, segment }) => index + segment.length));
};
export const isBreakableSpace = (segment: string) => breakableSpace.test(segment);
export const visibleText = (text: string) => text.replace(trailingSpace, "");

export const paragraphsOf = function* (text: string) {
  let start = 0;
  for (const match of text.matchAll(hardBreak)) {
    yield { text: text.slice(start, match.index), start, breakAfter: match[0] };
    start = match.index + match[0].length;
  }
  yield { text: text.slice(start), start, breakAfter: "" };
};

const validBreaks = (text: string, offsets: readonly number[]) => {
  if (offsets.length === 0) return [];
  const boundaries = new Set(graphemesOf(text).map(({ index }) => index));
  for (const offset of offsets) {
    if (!Number.isInteger(offset) || offset <= 0 || offset >= text.length || !boundaries.has(offset)) {
      throw new RangeError("forcedBreaks must contain interior UTF-16 grapheme boundaries");
    }
  }
  return [...new Set(offsets)].sort((left, right) => left - right);
};

export const segmentsWithBreaks = function* (text: string, offsets: readonly number[] = []) {
  const breaks = validBreaks(text, offsets);
  let cursor = 0;
  for (const paragraph of paragraphsOf(text)) {
    const end = paragraph.start + paragraph.text.length;
    let start = paragraph.start;
    while (cursor < breaks.length && breaks[cursor]! <= start) cursor++;
    while (cursor < breaks.length && breaks[cursor]! < end) {
      const offset = breaks[cursor++]!;
      yield { text: text.slice(start, offset), start, breakAfter: "" };
      start = offset;
    }
    yield { text: text.slice(start, end), start, breakAfter: paragraph.breakAfter };
  }
};

export const manualLines = (text: string, offsets?: readonly number[]): WrappedLine[] =>
  Array.from(segmentsWithBreaks(text, offsets), ({ text: line, start, breakAfter }) => ({
    text: line, start, end: start + line.length, width: 0, breakAfter,
  }));

export const segmentSentences = (text: string, locale = "ko"): TextSegment[] => {
  const sentences = new Intl.Segmenter(locale, { granularity: "sentence" });
  return Array.from(sentences.segment(text), ({ segment, index }) => ({ text: segment, start: index, end: index + segment.length }));
};
