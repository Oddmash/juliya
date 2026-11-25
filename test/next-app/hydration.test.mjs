import test from "node:test";
import assert from "node:assert/strict";
import { createElement, act, Fragment } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { wrap } from "@oddmash/juliya";
import { JuliyaProvider, JuliyaText, useJuliya, WrapText, useKowrap } from "@oddmash/juliya/react";

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

test("Juliya hydrates locale context and recalculates on provider changes", async () => {
  const text = "日本語と韓国語の自然な改行";
  const measure = (value) => [...value].length * 10;
  const expected = (locale) => wrap(text, { locale, measure, width: 60 }).map((line) => line.text);
  assert.notDeepEqual(expected("ja"), expected("ko"));
  let layout;
  const Example = () => {
    layout = useJuliya({ text });
    return createElement("p", { ref: layout.ref, lang: layout.locale, id: "custom" }, text);
  };
  const element = (locale) => createElement(JuliyaProvider, { locale },
    createElement(JuliyaText, { as: "p", id: "title" }, text),
    createElement(JuliyaText, { as: "p", id: "override", locale: "ja" }, text),
    createElement(Example),
  );
  const dom = new JSDOM(`<div id="root">${renderToString(element("ja"))}</div>`);
  const { window } = dom;
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(window.HTMLElement.prototype, "clientWidth", { get: () => 61 });
  window.HTMLCanvasElement.prototype.getContext = () => ({ font: "", measureText: (value) => ({ width: measure(value) }) });
  const errors = [];
  let root;
  try {
    await act(async () => { root = hydrateRoot(window.document.getElementById("root"), element("ja"), { onRecoverableError: (error) => errors.push(error.message) }); });
    const title = window.document.getElementById("title");
    const custom = window.document.getElementById("custom");
    const override = window.document.getElementById("override");
    const linesOf = (node) => node.innerHTML.replaceAll("<!-- -->", "").split(/<br\s*\/?\s*>/);
    assert.equal(title.lang, "ja");
    assert.equal(custom.lang, "ja");
    assert.deepEqual(linesOf(title), expected("ja"));
    assert.deepEqual(layout.lines.map((line) => line.text), expected("ja"));
    await act(async () => { root.render(element("ko")); });
    assert.equal(title.lang, "ko");
    assert.equal(custom.lang, "ko");
    assert.equal(override.lang, "ja");
    assert.deepEqual(linesOf(title), expected("ko"));
    assert.deepEqual(linesOf(override), expected("ja"));
    assert.deepEqual(layout.lines.map((line) => line.text), expected("ko"));
    assert.equal(title.textContent, text);
    assert.deepEqual(errors, []);
  } finally {
    if (root) await act(async () => root.unmount());
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    globalThis.IS_REACT_ACT_ENVIRONMENT = oldActEnvironment;
    window.close();
  }
});
