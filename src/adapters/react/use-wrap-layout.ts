import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { observeKowrap } from "../../dom/observe.js";
import { manualLines } from "../../core/segmentation.js";
import type { WrapOptions, WrappedLine } from "../../core/types.js";
import type { TextTag } from "./types.js";

interface LayoutOptions {
  text: string;
  locale?: WrapOptions["locale"];
  strategy: NonNullable<WrapOptions["strategy"]>;
  breakLongWords: boolean;
  forcedBreaks?: readonly number[];
  style?: CSSProperties;
  className?: string;
  tag: TextTag;
}

interface Layout {
  text: string;
  locale?: WrapOptions["locale"];
  strategy: LayoutOptions["strategy"];
  breakLongWords: boolean;
  breakKey: string;
  measured: boolean;
  lines: WrappedLine[];
}

const keyOf = (forcedBreaks?: readonly number[]) => forcedBreaks?.join(",") ?? "";

const matches = (layout: Layout | undefined, { text, locale, strategy, breakLongWords, forcedBreaks }: LayoutOptions) =>
  layout?.text === text && layout.locale === locale && layout.strategy === strategy && layout.breakLongWords === breakLongWords && layout.breakKey === keyOf(forcedBreaks);

const sameBreaks = (previous: WrappedLine[], next: WrappedLine[]) =>
  previous.length === next.length && previous.every((line, index) => line.end === next[index]?.end && line.width === next[index]?.width);

export const useWrapLayout = (options: LayoutOptions) => {
  const { text, locale, strategy, breakLongWords, forcedBreaks, style, className, tag } = options;
  const breakKey = keyOf(forcedBreaks);
  const fallback = useMemo(() => manualLines(text, forcedBreaks), [text, breakKey]);
  const elementRef = useRef<HTMLElement | null>(null);
  const ref = useCallback((element: HTMLElement | null) => { elementRef.current = element; }, []);
  const [layout, setLayout] = useState<Layout>();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const controller = observeKowrap(element, { text, locale, strategy, breakLongWords, forcedBreaks }, ({ lines, measured }) => {
      setLayout((previous) => matches(previous, { text, locale, strategy, breakLongWords, forcedBreaks, tag }) && previous!.measured === measured && sameBreaks(previous!.lines, lines)
        ? previous : { text, locale, strategy, breakLongWords, breakKey, measured, lines });
    });
    return controller.destroy;
  }, [text, locale, strategy, breakLongWords, breakKey, style, className, tag]);

  const current = matches(layout, options) ? layout : undefined;
  return { ref, lines: current?.lines ?? fallback, measured: current?.measured ?? false };
};

