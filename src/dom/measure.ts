import type { Measure } from "../core/types.js";

export interface CanvasMeasureOptions {
  font: string;
  letterSpacing?: string;
  wordSpacing?: string;
  fontKerning?: CanvasFontKerning;
}

export const createLocalizedCanvasMeasure = (options: CanvasMeasureOptions, ownerDocument: Document, language: string | undefined): Measure => {
  const canvas = ownerDocument.createElement("canvas");
  if (language !== undefined) canvas.lang = language;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D measurement is unavailable");
  context.font = options.font;
  if (options.letterSpacing && "letterSpacing" in context) context.letterSpacing = options.letterSpacing;
  if (options.wordSpacing && "wordSpacing" in context) context.wordSpacing = options.wordSpacing;
  if (options.fontKerning) context.fontKerning = options.fontKerning;
  return (text) => context.measureText(text).width;
};

export const createCanvasMeasure = (options: CanvasMeasureOptions, ownerDocument: Document = document): Measure =>
  createLocalizedCanvasMeasure(options, ownerDocument, ownerDocument.documentElement?.lang);

export const languageOf = (element: HTMLElement): string | undefined =>
  element.closest("[lang]")?.getAttribute("lang") ?? undefined;
