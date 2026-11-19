import { createLocalizedCanvasMeasure, languageOf } from "./measure.js";
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
  let observedWidth: { fallback: number; exact: number } | undefined;

  const update = (contentWidth?: number) => {
    if (!active) return;
    let layout: ElementLayout | undefined;
    try {
      const computed = view.getComputedStyle(element);
      const fallback = element.clientWidth - numericPadding(computed.paddingLeft) - numericPadding(computed.paddingRight);
      if (contentWidth !== undefined) observedWidth = { fallback, exact: contentWidth };
      if (observedWidth?.fallback !== fallback) observedWidth = undefined;
      // clientWidth is rounded. Prefer the observer's content box when available.
      const width = observedWidth?.exact ?? (fallback > 0 ? Math.max(1, fallback - 1) : 0);
      if (!(width > 0)) {
        layout = undefined;
      } else {
        const font = fontOf(computed);
        const language = languageOf(element);
        const signature = JSON.stringify([font, language]);
        if (!measure || previousFont !== signature) {
          measure = createLocalizedCanvasMeasure(font, doc, language);
          previousFont = signature;
        }
        layout = { width, measure };
      }
    } catch {
      layout = undefined;
    }
    onLayout(layout);
  };

  const refresh = () => update();
  const onFonts = () => {
    measure = undefined;
    update();
  };
  const Observer = view.ResizeObserver ?? globalThis.ResizeObserver;
  const observer = Observer ? new Observer((entries) => update(entries?.[0]?.contentRect.width)) : undefined;
  observer?.observe(element);
  view.addEventListener("resize", refresh);
  doc.fonts?.addEventListener("loadingdone", onFonts);
  void doc.fonts?.ready.then(onFonts);
  update();

  const destroy = () => {
    active = false;
    observer?.disconnect();
    view.removeEventListener("resize", refresh);
    doc.fonts?.removeEventListener("loadingdone", onFonts);
  };
  return { refresh, destroy };
};
