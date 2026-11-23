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
  return { dom, element, resize: (value, entries) => { width = value; observer(entries); }, count: () => created, disconnected: () => disconnected };
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

test("initial inline measurement uses the resolved content width before ResizeObserver delivers", () => {
  const { dom, element, resize } = fixture();
  element.style.cssText = "box-sizing:border-box;width:124.25px;padding:10px;border:2px solid";
  element.textContent = "가나다라마바사아자차";
  const controller = mountKowrap(element, { inline: true });
  assert.equal(element.querySelector("br"), null, "100px of text fits inside 100.25px");
  resize(120, [{ contentRect: { width: 99.75 } }]);
  assert.ok(element.querySelector("br"), "the precise observer width still takes priority");
  controller.destroy();
  dom.window.close();
});

test("resize delivery schedules rendering outside the observer and cancels on destroy", () => {
  const { dom, element, resize } = fixture();
  let frame;
  dom.window.requestAnimationFrame = (callback) => { frame = callback; return 1; };
  dom.window.cancelAnimationFrame = () => { frame = undefined; };
  const controller = mountKowrap(element, { text: "오늘은 모든 사람이 함께" });
  const initial = element.innerHTML;
  assert.ok(element.querySelector("br"));
  resize(400, [{ contentRect: { width: 380 } }]);
  assert.equal(element.innerHTML, initial);
  frame();
  assert.equal(element.querySelector("br"), null);
  resize(120, [{ contentRect: { width: 100 } }]);
  assert.equal(typeof frame, "function");
  controller.destroy();
  assert.equal(frame, undefined);
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

test("inline DOM preserves nested element identities and handlers across resize and destroy", () => {
  const { dom, element, resize } = fixture();
  element.innerHTML = '읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong><br><a href="#docs">문서 보기</a>';
  const original = element.innerHTML;
  const text = element.textContent;
  const link = element.querySelector("a");
  const emphasis = element.querySelector("em");
  let clicks = 0;
  link.addEventListener("click", () => clicks++);
  const controller = mountKowrap(element, { inline: true, forcedBreaks: [2] });
  assert.ok(element.querySelectorAll("br[data-kowrap-break]").length > 0);
  assert.equal(element.textContent, text);
  resize(800);
  assert.equal(element.querySelectorAll("br").length, 2);
  assert.equal(element.querySelector("a"), link);
  assert.equal(element.querySelector("em"), emphasis);
  link.click();
  assert.equal(clicks, 1);
  controller.destroy();
  assert.equal(element.innerHTML, original);
  dom.window.close();
});
