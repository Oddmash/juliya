import { createLocalizedCanvasMeasure, languageOf } from "./measure.js";
import type { CanvasMeasureOptions } from "./measure.js";
import type { Measure } from "../core/types.js";

export interface ElementLayout {
  width: number;
  measure: Measure;
}

const numericLength = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const computedContentWidth = (computed: CSSStyleDeclaration, padding: number, roundedWidth: number) => {
  if (!computed.width.endsWith("px")) return undefined;
  const border = numericLength(computed.borderLeftWidth) + numericLength(computed.borderRightWidth);
  const inset = computed.boxSizing === "border-box" ? padding + border : 0;
  const width = Number.parseFloat(computed.width) - inset;
  return width > 0 && Math.abs(width - roundedWidth) <= 0.5 ? width : undefined;
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
  let frame: number | undefined;

  const update = (contentWidth?: number) => {
    if (!active) return;
    let layout: ElementLayout | undefined;
    try {
      const computed = view.getComputedStyle(element);
      const padding = numericLength(computed.paddingLeft) + numericLength(computed.paddingRight);
      const fallback = element.clientWidth - padding;
      if (contentWidth !== undefined) observedWidth = { fallback, exact: contentWidth };
      if (observedWidth?.fallback !== fallback) observedWidth = undefined;
      // clientWidth is rounded. Use it to validate the computed width until the observer delivers.
      const width = observedWidth?.exact ?? (fallback > 0
        ? computedContentWidth(computed, padding, fallback) ?? Math.max(1, fallback - 1)
        : 0);
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
  const observer = Observer ? new Observer((entries) => {
    const width = entries?.[0]?.contentRect.width;
    if (width === undefined || !view.requestAnimationFrame) {
      update(width);
      return;
    }
    if (frame !== undefined) view.cancelAnimationFrame(frame);
    // Rendering can change the observed element's height.
    frame = view.requestAnimationFrame(() => {
      frame = undefined;
      update(width);
    });
  }) : undefined;
  observer?.observe(element);
  view.addEventListener("resize", refresh);
  doc.fonts?.addEventListener("loadingdone", onFonts);
  void doc.fonts?.ready.then(onFonts);
  update();

  const destroy = () => {
    active = false;
    if (frame !== undefined) view.cancelAnimationFrame(frame);
    observer?.disconnect();
    view.removeEventListener("resize", refresh);
    doc.fonts?.removeEventListener("loadingdone", onFonts);
  };
  return { refresh, destroy };
};
