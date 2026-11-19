"use client";

import { Children, cloneElement, Fragment, isValidElement, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, ReactElement } from "react";
import type { WrapOptions } from "../../core/types.js";
import type { TextProps } from "./types.js";
import { useWrapLayout } from "./use-wrap-layout.js";
import { breakOffsets, inlineBreakAttribute, observeInline } from "../../dom/inline.js";
import { manualLines } from "../../core/segmentation.js";

export interface WrapTextProps extends Omit<TextProps, "children"> {
  children: ReactNode;
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

const PlainText = ({ children, as: Tag = "span", strategy = "balanced", breakLongWords = true, forcedBreaks, style, className, ...props }: WrapTextProps & { children: string }) => {
  const { ref, lines } = useWrapLayout({ text: children, strategy, breakLongWords, forcedBreaks, style, className, tag: Tag });
  return <Tag {...props} className={className} style={{ ...baseStyle, overflowWrap: breakLongWords ? "anywhere" : "normal", ...style }} ref={ref}>
    {lines.length > 1 ? lines.map((line, index) => <Fragment key={line.start}>
      {line.text}{line.breakAfter || (index < lines.length - 1 ? <br /> : null)}
    </Fragment>) : children}
  </Tag>;
};

const inlineText = (children: ReactNode): string => Children.toArray(children).map((child) => {
  if (typeof child === "string" || typeof child === "number" || typeof child === "bigint") return String(child);
  if (isValidElement<{ children?: ReactNode }>(child)) return child.type === "br" ? "\n" : inlineText(child.props.children);
  return "";
}).join("");

const renderInline = (children: ReactNode, offsets: number[]) => {
  let cursor = 0;
  const visit = (nodes: ReactNode): ReactNode => Children.map(nodes, (child) => {
    if (typeof child === "string" || typeof child === "number" || typeof child === "bigint") {
      const text = String(child);
      const start = cursor;
      cursor += text.length;
      const breaks = offsets.filter((offset) => start < offset && offset <= cursor);
      if (!breaks.length) return child;
      let left = 0;
      const parts: ReactNode[] = [];
      for (const offset of breaks) {
        parts.push(text.slice(left, offset - start), <br key={offset} {...{ [inlineBreakAttribute]: "" }} />);
        left = offset - start;
      }
      parts.push(text.slice(left));
      return <Fragment>{parts}</Fragment>;
    }
    if (isValidElement<{ children?: ReactNode }>(child)) {
      if (child.type === "br") { cursor++; return child; }
      return cloneElement(child as ReactElement<{ children?: ReactNode }>, undefined, visit(child.props.children));
    }
    return child;
  });
  return visit(children);
};

const InlineText = ({ children, as: Tag = "span", strategy = "balanced", breakLongWords = true, forcedBreaks, style, className, ...props }: WrapTextProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const text = inlineText(children);
  const key = `${text}:${forcedBreaks?.join(",") ?? ""}`;
  const [layout, setLayout] = useState<{ key: string; offsets: number[] }>();
  const offsets = layout?.key === key ? layout.offsets : breakOffsets(manualLines(text, forcedBreaks));
  useEffect(() => {
    if (!ref.current) return;
    const observer = observeInline(ref.current, () => ({ inline: true, strategy, breakLongWords, forcedBreaks }), (next) => {
      setLayout((previous) => previous?.key === key && previous.offsets.join(",") === next.join(",") ? previous : { key, offsets: next });
    });
    return observer.destroy;
  }, [key, children, strategy, breakLongWords, style, className, Tag]);
  return <Tag {...props} className={className} style={{ ...baseStyle, overflowWrap: breakLongWords ? "anywhere" : "normal", ...style }} ref={(element) => { ref.current = element; }}>{renderInline(children, offsets)}</Tag>;
};

export const WrapText = (props: WrapTextProps) => typeof props.children === "string" ? <PlainText {...props} children={props.children} /> : <InlineText {...props} />;
