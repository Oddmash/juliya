import test from "node:test";
import assert from "node:assert/strict";
import { createElement, act, Fragment } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { WrapText, useKowrap } from "@oddmash/kowrap/react";

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

test("public React hook sets and clears manual break positions", async () => {
  const text = "한국어 줄바꿈";
  let layout;
  const Example = () => {
    layout = useKowrap({ text, initialForcedBreaks: [3] });
    return createElement("p", { ref: layout.ref, id: "custom" }, layout.lines.map((line, index) => createElement(Fragment, { key: line.start }, line.text, index < layout.lines.length - 1 ? createElement("br") : null)));
  };
  const element = createElement(Example);
  const dom = new JSDOM(`<div id="root">${renderToString(element)}</div>`);
  const { window } = dom;
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(window.HTMLElement.prototype, "clientWidth", { get: () => 1000 });
  window.HTMLCanvasElement.prototype.getContext = () => ({ font: "", measureText: (value) => ({ width: [...value].length * 10 }) });
  const errors = [];
  let root;
  try {
    await act(async () => { root = hydrateRoot(window.document.getElementById("root"), element, { onRecoverableError: (error) => errors.push(error.message) }); });
    const target = window.document.getElementById("custom");
    assert.equal(target.querySelectorAll("br").length, 1);
    await act(async () => layout.clearForcedBreaks());
    assert.equal(target.querySelectorAll("br").length, 0);
    await act(async () => layout.setForcedBreaks([4]));
    assert.equal(target.querySelectorAll("br").length, 1);
    assert.equal(target.textContent, text);
    assert.deepEqual(errors, []);
  } finally {
    if (root) await act(async () => root.unmount());
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    globalThis.IS_REACT_ACT_ENVIRONMENT = oldActEnvironment;
    window.close();
  }
});
