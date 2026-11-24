export type Measure = (text: string) => number;
export type WrapLocale = "ko" | "en" | "ja" | "zh" | "zh-Hans";

export interface WrapOptions {
  locale?: WrapLocale;
  width: number;
  measure: Measure;
  measureRange?: (start: number, end: number) => number;
  strategy?: "balanced" | "greedy";
  breakLongWords?: boolean;
  forcedBreaks?: readonly number[];
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

export interface ParagraphOptions {
  locale?: WrapLocale;
  width: number;
  measure: Measure;
  measureRange?: (start: number, end: number) => number;
  strategy: NonNullable<WrapOptions["strategy"]>;
  breakLongWords: boolean;
}

export interface Boundary {
  offset: number;
  emergency: boolean;
}

export interface LineCandidate {
  next: number;
  width: number;
  fragment: string;
  emergency: boolean;
}

export interface PlannedLine {
  start: number;
  end: number;
  width: number;
}
