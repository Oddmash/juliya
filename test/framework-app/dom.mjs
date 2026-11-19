import { JSDOM } from "jsdom";

export const initDOM = () => {
  const dom = new JSDOM('<div id="root"></div>', { pretendToBeVisual: true });
  const { window } = dom;
  for (const key of ["window", "document", "navigator", "HTMLElement", "SVGElement", "Element", "Node", "Text", "Comment", "MutationObserver", "CustomEvent", "Event", "EventTarget"]) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? window : window[key] });
  }
  globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  Object.defineProperty(window.HTMLElement.prototype, "clientWidth", { get: () => 1000 });
  window.HTMLCanvasElement.prototype.getContext = () => ({ font: "", measureText: (value) => ({ width: [...value].length * 10 }) });
  return dom;
};
