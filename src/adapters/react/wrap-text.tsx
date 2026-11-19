"use client";

import { Fragment } from "react";
import type { CSSProperties } from "react";
import type { WrapOptions } from "../../core/types.js";
import type { TextProps } from "./types.js";
import { useWrapLayout } from "./use-wrap-layout.js";

export interface WrapTextProps extends TextProps {
  strategy?: WrapOptions["strategy"];
  breakLongWords?: boolean;
  forcedBreaks?: readonly number[];
}

const baseStyle: CSSProperties = {
  display: "block",
  whiteSpace: "pre-wrap",
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
  textWrap: "pretty",
};

export const WrapText = ({ children, as: Tag = "span", strategy = "balanced", breakLongWords = true, forcedBreaks, style, className, ...props }: WrapTextProps) => {
  const { ref, lines } = useWrapLayout({ text: children, strategy, breakLongWords, forcedBreaks, style, className, tag: Tag });
  return <Tag {...props} className={className} style={{ ...baseStyle, overflowWrap: breakLongWords ? "anywhere" : "normal", ...style }} ref={ref}>
    {lines.length > 1 ? lines.map((line, index) => <Fragment key={line.start}>
      {line.text}{line.breakAfter || (index < lines.length - 1 ? <br /> : null)}
    </Fragment>) : children}
  </Tag>;
};
