"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { createCanvasMeasure } from "./browser.js";
import { wrap } from "./index.js";
import type { WrapOptions, WrappedLine } from "./index.js";

export interface WrapTextProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML"> {
  children: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  strategy?: WrapOptions["strategy"];
  breakLongWords?: boolean;
}

const baseStyle: CSSProperties = {
  display: "block",
  whiteSpace: "pre-wrap",
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
  textWrap: "pretty",
};

interface Layout {
  text: string;
  strategy: WrapOptions["strategy"];
  breakLongWords: boolean;
  lines: WrappedLine[];
}

export const WrapText = ({ children, as: Tag = "span", strategy = "balanced", breakLongWords = true, style, className, ...props }: WrapTextProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const [layout, setLayout] = useState<Layout>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const doc = element.ownerDocument;
    const view = doc.defaultView;
    if (!view) return;
    let active = true;
    const update = () => {
      if (!active) return;
      const computed = view.getComputedStyle(element);
      const width = element.clientWidth - parseFloat(computed.paddingLeft || "0") - parseFloat(computed.paddingRight || "0");
      if (!(width > 0)) return;
      try {
        const measure = createCanvasMeasure({
          font: computed.font || `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`,
          letterSpacing: computed.letterSpacing === "normal" ? "0px" : computed.letterSpacing,
          wordSpacing: computed.wordSpacing === "normal" ? "0px" : computed.wordSpacing,
          fontKerning: computed.fontKerning as CanvasFontKerning,
        }, doc);
        const lines = wrap(children, { width: Math.max(1, width - 1), measure, strategy, breakLongWords });
        setLayout((previous) => previous?.text === children && previous.strategy === strategy && previous.breakLongWords === breakLongWords && previous.lines.length === lines.length && previous.lines.every((line, index) => line.end === lines[index]?.end) ? previous : { text: children, strategy, breakLongWords, lines });
      } catch {
        setLayout(undefined);
      }
    };
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    observer?.observe(element);
    view.addEventListener("resize", update);
    doc.fonts?.addEventListener("loadingdone", update);
    void doc.fonts?.ready.then(update);
    update();
    return () => {
      active = false;
      observer?.disconnect();
      view.removeEventListener("resize", update);
      doc.fonts?.removeEventListener("loadingdone", update);
    };
  }, [children, strategy, breakLongWords, style, className, Tag]);

  const lines = layout?.text === children && layout.strategy === strategy && layout.breakLongWords === breakLongWords ? layout.lines : undefined;
  return <Tag {...props} className={className} style={{ ...baseStyle, overflowWrap: breakLongWords ? "anywhere" : "normal", ...style }} ref={(element) => { ref.current = element; }}>
    {lines && lines.length > 1 ? lines.map((line, index) => <Fragment key={line.start}>
      {line.text}{line.breakAfter || (index < lines.length - 1 ? <br /> : null)}
    </Fragment>) : children}
  </Tag>;
};
