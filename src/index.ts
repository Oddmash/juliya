export type Measure = (text: string) => number;

export interface WrapOptions {
  width: number;
  measure: Measure;
  strategy?: "balanced" | "greedy";
  breakLongWords?: boolean;
}

export interface WrappedLine {
  text: string;
  start: number;
  end: number;
  width: number;
  breakAfter: string;
}

export interface TextSegment {
  text: string;
  start: number;
  end: number;
}

export const segmentSentences = (text: string, locale = "ko"): TextSegment[] => {
  const sentences = new Intl.Segmenter(locale, { granularity: "sentence" });
  return Array.from(sentences.segment(text), ({ segment, index }) => ({ text: segment, start: index, end: index + segment.length }));
};

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const breakable = /[ \t\f\v\u2000-\u2006\u2008-\u200a\u205f\u3000]/u;
const trailing = /[ \t\f\v\u2000-\u2006\u2008-\u200a\u205f\u3000]+$/u;
const hardBreak = /\r\n|[\r\n\u2028\u2029]/gu;
const sentenceEnd = /[.!?。！？…][”’"')\]]*$/u;
const clauseEnd = /[,;:，、；：]$/u;
const boundModifier = /(?:^|\s)(?:이|그|저|각|모든|어떤|이런|그런|저런|새로운|다음|해당|본|여러|\S+(?:들의|에서의|로서의|으로의|와의|과의|사이의))$/u;

interface Boundary {
  offset: number;
  emergency: boolean;
}

interface Choice {
  count: number;
  cost: number;
  next: number;
  width: number;
}

const visible = (text: string) => text.replace(trailing, "");

const boundariesOf = (text: string, width: number, measure: Measure, split: boolean) => {
  const points: Boundary[] = [{ offset: 0, emergency: false }];
  const graphemes = [...segmenter.segment(text)];
  let cursor = 0;
  while (cursor < graphemes.length) {
    while (cursor < graphemes.length && breakable.test(graphemes[cursor]!.segment)) cursor++;
    const start = cursor;
    if (points.length === 1 && start > 0 && start < graphemes.length) points.push({ offset: graphemes[start]!.index, emergency: true });
    while (cursor < graphemes.length && !breakable.test(graphemes[cursor]!.segment)) cursor++;
    const end = cursor;
    while (cursor < graphemes.length && breakable.test(graphemes[cursor]!.segment)) cursor++;
    if (split && start < end) {
      const wordStart = graphemes[start]!.index;
      const wordEnd = graphemes[end]?.index ?? text.length;
      if (measure(text.slice(wordStart, wordEnd)) > width) {
        for (let i = start + 1; i < end; i++) {
          points.push({ offset: graphemes[i]!.index, emergency: true });
        }
      }
    }
    const offset = graphemes[cursor]?.index ?? text.length;
    if (offset > points[points.length - 1]!.offset) points.push({ offset, emergency: false });
  }
  return points;
};

const wrapParagraph = (text: string, base: number, options: WrapOptions, measure: Measure): WrappedLine[] => {
  const width = options.width;
  const fullWidth = measure(visible(text));
  if (!text || fullWidth <= width) return [{ text, start: base, end: base + text.length, width: fullWidth, breakAfter: "" }];

  const points = boundariesOf(text, width, measure, options.breakLongWords !== false);
  const last = points.length - 1;
  const choices: Choice[] = [];
  choices[last] = { count: 0, cost: 0, next: last, width: 0 };

  for (let i = last - 1; i >= 0; i--) {
    let best: Choice | undefined;
    for (let j = i + 1; j <= last; j++) {
      const fragment = visible(text.slice(points[i]!.offset, points[j]!.offset));
      const measured = measure(fragment);
      if (measured > width && j > i + 1) break;
      const tail = choices[j]!;
      const slack = (width - Math.min(measured, width)) / width;
      const overflow = Math.max(0, measured - width) / width;
      const boundaryCost = points[j]!.emergency ? 0.75 : sentenceEnd.test(fragment) ? 0 : clauseEnd.test(fragment) ? 0.02 : boundModifier.test(fragment) ? 0.35 : 0.06;
      const cost = tail.cost + slack ** 2 + overflow ** 2 * 4 + (j === last ? 0 : boundaryCost);
      const next = { count: tail.count + 1, cost, next: j, width: measured };
      if (options.strategy === "greedy" || !best || next.count < best.count || (next.count === best.count && next.cost < best.cost)) best = next;
      if (measured > width) break;
    }
    choices[i] = best!;
  }

  const lines: WrappedLine[] = [];
  for (let i = 0; i < last;) {
    const choice = choices[i]!;
    const start = points[i]!.offset;
    const end = points[choice.next]!.offset;
    lines.push({ text: text.slice(start, end), start: base + start, end: base + end, width: choice.width, breakAfter: "" });
    i = choice.next;
  }
  return lines;
};

export const wrap = (text: string, options: WrapOptions): WrappedLine[] => {
  if (!Number.isFinite(options.width) || options.width <= 0) throw new RangeError("width must be positive and finite");
  const measure: Measure = (value) => {
    if (!value) return 0;
    const result = options.measure(value);
    if (!Number.isFinite(result) || result < 0) throw new RangeError("measure must return a non-negative finite number");
    return result;
  };
  const lines: WrappedLine[] = [];
  let start = 0;
  for (const match of text.matchAll(hardBreak)) {
    const paragraph = wrapParagraph(text.slice(start, match.index), start, options, measure);
    paragraph[paragraph.length - 1]!.breakAfter = match[0];
    lines.push(...paragraph);
    start = match.index + match[0].length;
  }
  lines.push(...wrapParagraph(text.slice(start), start, options, measure));
  return lines;
};
