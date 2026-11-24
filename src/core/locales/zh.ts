import { createLocale } from "./create.js";
export type { LocaleWrapOptions as WrapOptions } from "./create.js";
export type { Measure, WrappedLine, TextSegment } from "../types.js";
export const { wrap, segmentSentences, splitLines } = createLocale("zh-Hans");
