import { graphemesOf, isBreakableSpace, visibleText } from "./segmentation.js";
import type { Boundary, LineCandidate, ParagraphOptions } from "./types.js";

export const boundariesOf = (text: string, { width, measure, measureRange, breakLongWords }: ParagraphOptions): Boundary[] => {
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
