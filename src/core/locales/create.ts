import { manualLines, segmentSentences as sentences } from "../segmentation.js";
import { wrap as wrapText } from "../wrap.js";
import type { WrapLocale, WrapOptions } from "../types.js";

export type LocaleWrapOptions = Omit<WrapOptions, "locale">;

export const createLocale = (locale: WrapLocale) => ({
  wrap: (text: string, options: LocaleWrapOptions) => wrapText(text, { ...options, locale }),
  segmentSentences: (text: string) => sentences(text, locale),
  splitLines: manualLines,
});
