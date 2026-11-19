import { manualLines } from "../core/segmentation.js";
import { wrap } from "../core/wrap.js";
import { observeElementLayout } from "./observe-element.js";
import type { KowrapController, KowrapLayout, KowrapOptions } from "./types.js";

export const observeKowrap = (element: HTMLElement, initial: KowrapOptions, onLayout: (layout: KowrapLayout) => void): KowrapController => {
  let options = initial;
  let active = true;
  let fallback = manualLines(options.text, options.forcedBreaks);
  const observer = observeElementLayout(element, (measurement) => {
    if (!measurement) {
      onLayout({ lines: fallback, measured: false });
      return;
    }
    const lines = wrap(options.text, { ...options, ...measurement });
    onLayout({ lines, measured: true });
  });
  return {
    update: (next) => {
      if (!active) return;
      fallback = manualLines(next.text, next.forcedBreaks);
      options = next;
      observer.refresh();
    },
    refresh: () => { if (active) observer.refresh(); },
    destroy: () => {
      if (!active) return;
      active = false;
      observer.destroy();
    },
  };
};

