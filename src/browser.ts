import type { Measure } from "./index.js";

export interface CanvasMeasureOptions {
  font: string;
  letterSpacing?: string;
  wordSpacing?: string;
  fontKerning?: CanvasFontKerning;
}

export const createCanvasMeasure = (options: CanvasMeasureOptions, ownerDocument: Document = document): Measure => {
  const context = ownerDocument.createElement("canvas").getContext("2d");
  if (!context) throw new Error("Canvas 2D measurement is unavailable");
  context.font = options.font;
  if (options.letterSpacing && "letterSpacing" in context) context.letterSpacing = options.letterSpacing;
  if (options.wordSpacing && "wordSpacing" in context) context.wordSpacing = options.wordSpacing;
  if (options.fontKerning) context.fontKerning = options.fontKerning;
  return (text) => context.measureText(text).width;
};
