import test from "node:test";
import assert from "node:assert/strict";
import { createElement, act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { WrapText } from "@oddmash/kowrap/react";

test("hydrates original SSR text and recalculates on a resize", async () => {
  const text = "오늘은 모든 사람이 함께 자연스러운 한국어 줄바꿈을 경험합니다.";
  const element = createElement(WrapText, { as: "h1", id: "title" }, text);
  const html = renderToString(element);
  const dom = new JSDOM(`<div id="root">${html}</div>`);
  const { window } = dom;
  const { document } = window;
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  let width = 120;
  let resize;
  const oldObserver = globalThis.ResizeObserver;
  globalThis.window = window;
  globalThis.document = document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect() {}
  };
  Object.defineProperty(window.HTMLElement.prototype, "clientWidth", { get: () => width });
  window.HTMLCanvasElement.prototype.getContext = () => ({ font: "", measureText: (value) => ({ width: [...value].length * 10 }) });
  const errors = [];
  let root;
  try {
    await act(async () => {
      root = hydrateRoot(document.getElementById("root"), element, { onRecoverableError: (error) => errors.push(error.message) });
    });
    const title = document.getElementById("title");
    const originalCount = title.querySelectorAll("br").length;
    assert.ok(originalCount > 0);
    assert.equal(title.textContent, text);
    await act(async () => { width = 900; resize(); });
    assert.equal(title.querySelectorAll("br").length, 0);
    assert.equal(title.textContent, text);
    assert.deepEqual(errors, []);
  } finally {
    if (root) await act(async () => root.unmount());
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    globalThis.ResizeObserver = oldObserver;
    globalThis.IS_REACT_ACT_ENVIRONMENT = oldActEnvironment;
    window.close();
  }
});
