import { createCanvasMeasure } from "./measure.js";
import type { CanvasMeasureOptions } from "./measure.js";
import type { Measure } from "../core/types.js";

export interface ElementLayout {
  width: number;
  measure: Measure;
}

const numericPadding = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const spacing = (value: string) => value === "normal" || !value ? "0px" : value;

export const fontOf = (computed: CSSStyleDeclaration): CanvasMeasureOptions => ({
  font: computed.font || `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`,
  letterSpacing: spacing(computed.letterSpacing),
  wordSpacing: spacing(computed.wordSpacing),
  fontKerning: computed.fontKerning as CanvasFontKerning,
});

export const observeElementLayout = (element: HTMLElement, onLayout: (layout: ElementLayout | undefined) => void) => {
  const doc = element.ownerDocument;
  const view = doc.defaultView;
  if (!view) {
    onLayout(undefined);
    return { refresh: () => onLayout(undefined), destroy: () => {} };
  }
  let active = true;
  let previousFont: string | undefined;
  let measure: Measure | undefined;

  const update = () => {
    if (!active) return;
    let layout: ElementLayout | undefined;
    try {
      const computed = view.getComputedStyle(element);
      const width = element.clientWidth - numericPadding(computed.paddingLeft) - numericPadding(computed.paddingRight);
      if (!(width > 0)) {
        layout = undefined;
      } else {
        const font = fontOf(computed);
        const signature = JSON.stringify(font);
        if (!measure || previousFont !== signature) {
          measure = createCanvasMeasure(font, doc);
          previousFont = signature;
        }
        layout = { width: Math.max(1, width - 1), measure };
      }
    } catch {
      layout = undefined;
    }
    onLayout(layout);
  };

  const onFonts = () => {
    measure = undefined;
    update();
  };
  const Observer = view.ResizeObserver ?? globalThis.ResizeObserver;
  const observer = Observer ? new Observer(update) : undefined;
  observer?.observe(element);
  view.addEventListener("resize", update);
  doc.fonts?.addEventListener("loadingdone", onFonts);
  void doc.fonts?.ready.then(onFonts);
  update();

  const destroy = () => {
    active = false;
    observer?.disconnect();
    view.removeEventListener("resize", update);
    doc.fonts?.removeEventListener("loadingdone", onFonts);
  };
  return { refresh: update, destroy };
};
