import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { mountKowrap, observeKowrap } from "@oddmash/kowrap/browser";
import { kowrapDirective } from "@oddmash/kowrap/vue";
import { kowrap } from "@oddmash/kowrap/svelte";

const fixture = () => {
  const dom = new JSDOM('<p id="text" style="white-space:normal;padding:10px">원문</p>');
  const element = dom.window.document.getElementById("text");
  let width = 120;
  let observer;
  let created = 0;
  let disconnected = false;
  Object.defineProperty(element, "clientWidth", { get: () => width });
  dom.window.ResizeObserver = class {
    constructor(callback) { observer = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  };
  dom.window.HTMLCanvasElement.prototype.getContext = () => {
    created++;
    return { font: "", measureText: (value) => ({ width: [...value].length * 10 }) };
  };
  return { dom, element, resize: (value) => { width = value; observer(); }, count: () => created, disconnected: () => disconnected };
};

test("vanilla controller preserves text, manual breaks, measurement reuse and cleanup", () => {
  const { dom, element, resize, count, disconnected } = fixture();
  const text = "첫 번째 줄과 두 번째 줄";
  const controller = mountKowrap(element, { text, forcedBreaks: [text.indexOf("두")] });
  assert.equal(element.textContent, text);
  assert.ok(element.querySelectorAll("br").length >= 1);
  const before = count();
  resize(500);
  assert.equal(count(), before);
  assert.equal(element.querySelectorAll("br").length, 1);
  controller.update({ text, forcedBreaks: [] });
  assert.equal(element.querySelectorAll("br").length, 0);
  controller.update({ text: "<script>안전한 텍스트</script>" });
  assert.equal(element.querySelector("script"), null);
  controller.destroy();
  assert.equal(element.style.whiteSpace, "normal");
  assert.ok(disconnected());
  dom.window.close();
});

test("data-only observer preserves manual lines when element has no width", () => {
  const { dom, element, resize } = fixture();
  const text = "가나다라마바사";
  let result;
  const controller = observeKowrap(element, { text, forcedBreaks: [3] }, (layout) => { result = layout; });
  assert.equal(result.measured, true);
  resize(0);
  assert.equal(result.measured, false);
  assert.deepEqual(result.lines.map(({ text }) => text), ["가나다", "라마바사"]);
  assert.equal(element.textContent, "원문");
  controller.destroy();
  dom.window.close();
});

test("Vue directive lifecycle updates and disconnects the shared controller", () => {
  const { dom, element, disconnected } = fixture();
  kowrapDirective.mounted(element, { value: { text: "첫 문장" } });
  kowrapDirective.updated(element, { value: { text: "다음 문장", forcedBreaks: [2] } });
  assert.equal(element.textContent, "다음 문장");
  assert.equal(element.querySelectorAll("br").length, 1);
  kowrapDirective.beforeUnmount(element);
  assert.ok(disconnected());
  dom.window.close();
});

test("Svelte action lifecycle updates and disconnects the shared controller", () => {
  const { dom, element, disconnected } = fixture();
  const action = kowrap(element, { text: "첫 문장" });
  action.update({ text: "다음 문장", forcedBreaks: [2] });
  assert.equal(element.textContent, "다음 문장");
  assert.equal(element.querySelectorAll("br").length, 1);
  action.destroy();
  assert.ok(disconnected());
  dom.window.close();
});
