import { planParagraph } from "./layout.js";
import { segmentsWithBreaks } from "./segmentation.js";
import type { Measure, ParagraphOptions, WrapOptions, WrappedLine } from "./types.js";

const checkedMeasure = (measure: Measure): Measure => (value) => {
  if (!value) return 0;
  const result = measure(value);
  if (!Number.isFinite(result) || result < 0) throw new RangeError("measure must return a non-negative finite number");
  return result;
};

export const wrap = (text: string, options: WrapOptions): WrappedLine[] => {
  if (!Number.isFinite(options.width) || options.width <= 0) throw new RangeError("width must be positive and finite");
  const paragraphOptions: ParagraphOptions = {
    width: options.width,
    measure: checkedMeasure(options.measure),
    strategy: options.strategy ?? "balanced",
    breakLongWords: options.breakLongWords !== false,
  };
  const lines: WrappedLine[] = [];
  for (const paragraph of segmentsWithBreaks(text, options.forcedBreaks)) {
    const plan = planParagraph(paragraph.text, { ...paragraphOptions, measureRange: options.measureRange ? (start, end) => {
      const result = options.measureRange!(paragraph.start + start, paragraph.start + end);
      if (!Number.isFinite(result) || result < 0) throw new RangeError("measureRange must return a non-negative finite number");
      return result;
    } : undefined });
    for (const [index, line] of plan.entries()) {
      lines.push({
        text: paragraph.text.slice(line.start, line.end),
        start: paragraph.start + line.start,
        end: paragraph.start + line.end,
        width: line.width,
        breakAfter: index === plan.length - 1 ? paragraph.breakAfter : "",
      });
    }
  }
  return lines;
};
