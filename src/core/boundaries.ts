import { graphemesOf, isBreakableSpace, visibleText, wordBoundariesOf } from "./segmentation.js";
import type { Boundary, LineCandidate, ParagraphOptions } from "./types.js";

const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const opening = /[（［｛〈《「『【〔〖〘〚“‘(\[{]$/u;
const closing = /^[、。，．！？；：）］｝〉》」』】〕〗〙〛”’、.,!?;:%)\]}ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー々]/u;

const cjkBoundaries = (text: string, options: ParagraphOptions): Boundary[] => {
  const units = graphemesOf(text);
  const words = wordBoundariesOf(text, options.locale === "ja" ? "ja" : "zh-Hans");
  const points: Boundary[] = [{ offset: 0, emergency: false }];
  for (let i = 1; i < units.length; i++) {
    const left = units[i - 1]!.segment;
    const right = units[i]!.segment;
    const offset = units[i]!.index;
    if (opening.test(left) || closing.test(right) || isBreakableSpace(right)) continue;
    if (isBreakableSpace(left) || cjk.test(left) || cjk.test(right) || words.has(offset)) {
      points.push({ offset, emergency: !words.has(offset) && !isBreakableSpace(left) });
    }
  }
  points.push({ offset: text.length, emergency: false });
  if (!options.breakLongWords) return points;
  const expanded: Boundary[] = [];
  let cursor = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]!.offset;
    const end = points[i + 1]!.offset;
    expanded.push(points[i]!);
    const fragment = visibleText(text.slice(start, end));
    const measured = options.measureRange ? options.measureRange(start, start + fragment.length) : options.measure(fragment);
    while (cursor < units.length && units[cursor]!.index <= start) cursor++;
    while (cursor < units.length && units[cursor]!.index < end) {
      if (measured > options.width) expanded.push({ offset: units[cursor]!.index, emergency: true });
      cursor++;
    }
  }
  expanded.push(points.at(-1)!);
  return expanded;
};

export const boundariesOf = (text: string, options: ParagraphOptions): Boundary[] => {
  const { width, measure, measureRange, breakLongWords, locale } = options;
  if (locale === "ja" || locale === "zh" || locale === "zh-Hans") return cjkBoundaries(text, options);
  const points: Boundary[] = [{ offset: 0, emergency: false }];
  const graphemes = graphemesOf(text);
  let cursor = 0;
  while (cursor < graphemes.length) {
    while (cursor < graphemes.length && isBreakableSpace(graphemes[cursor]!.segment)) cursor++;
    const start = cursor;
    if (points.length === 1 && start > 0 && start < graphemes.length) points.push({ offset: graphemes[start]!.index, emergency: true });
    while (cursor < graphemes.length && !isBreakableSpace(graphemes[cursor]!.segment)) cursor++;
    const end = cursor;
    while (cursor < graphemes.length && isBreakableSpace(graphemes[cursor]!.segment)) cursor++;
    if (breakLongWords && start < end) {
      const wordStart = graphemes[start]!.index;
      const wordEnd = graphemes[end]?.index ?? text.length;
      if ((measureRange ? measureRange(wordStart, wordEnd) : measure(text.slice(wordStart, wordEnd))) > width) {
        for (let i = start + 1; i < end; i++) points.push({ offset: graphemes[i]!.index, emergency: true });
      }
    }
    const offset = graphemes[cursor]?.index ?? text.length;
    if (offset > points[points.length - 1]!.offset) points.push({ offset, emergency: false });
  }
  return points;
};

export const candidatesFrom = function* (text: string, points: Boundary[], start: number, { width, measure, measureRange }: ParagraphOptions): Generator<LineCandidate> {
  for (let next = start + 1; next < points.length; next++) {
    const boundary = points[next]!;
    const fragment = visibleText(text.slice(points[start]!.offset, boundary.offset));
    const offset = points[start]!.offset;
    const measured = measureRange ? measureRange(offset, offset + fragment.length) : measure(fragment);
    if (measured > width && next > start + 1) break;
    yield { next, width: measured, fragment, emergency: boundary.emergency };
    if (measured > width) break;
  }
};
