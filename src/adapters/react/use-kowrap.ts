import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import { manualLines } from "../../core/segmentation.js";
import type { KowrapOptions } from "../../dom/types.js";
import type { TextTag } from "./types.js";
import { useWrapLayout } from "./use-wrap-layout.js";

export interface UseKowrapOptions extends KowrapOptions {
  initialForcedBreaks?: readonly number[];
  onForcedBreaksChange?: (breaks: readonly number[]) => void;
  style?: CSSProperties;
  className?: string;
  tag?: TextTag;
}

export const useKowrap = ({
  text, locale, strategy = "balanced", breakLongWords = true, forcedBreaks: controlledBreaks,
  initialForcedBreaks = [], onForcedBreaksChange, style, className, tag = "span",
}: UseKowrapOptions) => {
  const [internal, setInternal] = useState({ text, breaks: initialForcedBreaks });
  const forcedBreaks = controlledBreaks ?? (internal.text === text ? internal.breaks : []);
  const layout = useWrapLayout({ text, locale, strategy, breakLongWords, forcedBreaks, style, className, tag });
  const setForcedBreaks = useCallback((breaks: readonly number[]) => {
    manualLines(text, breaks);
    if (controlledBreaks === undefined) setInternal({ text, breaks: [...breaks] });
    onForcedBreaksChange?.(breaks);
  }, [text, controlledBreaks, onForcedBreaksChange]);
  const clearForcedBreaks = useCallback(() => setForcedBreaks([]), [setForcedBreaks]);
  return { ...layout, forcedBreaks, setForcedBreaks, clearForcedBreaks };
};
