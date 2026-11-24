import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import { manualLines } from "../../core/segmentation.js";
import type { KowrapOptions } from "../../dom/types.js";
import type { TextTag } from "./types.js";
import { useWrapLayout } from "./use-wrap-layout.js";
import { useJuliyaLocale } from "./juliya-provider.js";

export interface UseKowrapOptions extends KowrapOptions {
  initialForcedBreaks?: readonly number[];
  onForcedBreaksChange?: (breaks: readonly number[]) => void;
  style?: CSSProperties;
  className?: string;
  tag?: TextTag;
}

export type UseJuliyaOptions = UseKowrapOptions;

export const useJuliya = ({
  text, locale: explicitLocale, strategy = "balanced", breakLongWords = true, forcedBreaks: controlledBreaks,
  initialForcedBreaks = [], onForcedBreaksChange, style, className, tag = "span",
}: UseJuliyaOptions) => {
  const locale = useJuliyaLocale(explicitLocale);
  const [internal, setInternal] = useState({ text, breaks: initialForcedBreaks });
  const forcedBreaks = controlledBreaks ?? (internal.text === text ? internal.breaks : []);
  const layout = useWrapLayout({ text, locale, strategy, breakLongWords, forcedBreaks, style, className, tag });
  const setForcedBreaks = useCallback((breaks: readonly number[]) => {
    manualLines(text, breaks);
    if (controlledBreaks === undefined) setInternal({ text, breaks: [...breaks] });
    onForcedBreaksChange?.(breaks);
  }, [text, controlledBreaks, onForcedBreaksChange]);
  const clearForcedBreaks = useCallback(() => setForcedBreaks([]), [setForcedBreaks]);
  return { ...layout, locale: locale ?? "ko", forcedBreaks, setForcedBreaks, clearForcedBreaks };
};

export const useKowrap = useJuliya;
