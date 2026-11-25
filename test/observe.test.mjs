import assert from "node:assert/strict";
import test from "node:test";
import { observeKowrap } from "@oddmash/juliya/dom";

test("plain text observer skips duplicate resize deliveries but honors refresh and font changes", () => {
  let notify;
  let font = "16px sans-serif";
  let fontsChanged;
  const view = {
    ResizeObserver: class {
      constructor(callback) { notify = callback; }
      observe() {}
      disconnect() {}
    },
    getComputedStyle: () => ({ width: "100px", font }),
    addEventListener() {},
    removeEventListener() {},
  };
  const element = {
    clientWidth: 100,
    closest: () => null,
    ownerDocument: {
      defaultView: view,
      createElement: () => ({ getContext: () => ({ measureText: text => ({ width: text.length * 8 }) }) }),
      fonts: {
        ready: Promise.resolve(),
        addEventListener: (event, callback) => { fontsChanged = callback; },
        removeEventListener() {},
      },
    },
  };
  const layouts = [];
  const controller = observeKowrap(element, { text: "A simple sentence" }, layout => layouts.push(layout));
  const resize = width => notify([{ contentRect: { width } }]);
  try {
    assert.equal(layouts.length, 1);
    resize(100);
    resize(100);
    assert.equal(layouts.length, 1);
    resize(100.25);
    assert.equal(layouts.length, 2);
    resize(100.25);
    assert.equal(layouts.length, 2);
    controller.refresh();
    assert.equal(layouts.length, 3);
    controller.update({ text: "New text" });
    assert.equal(layouts.length, 4);
    assert.equal(layouts.at(-1).lines.map(line => line.text + line.breakAfter).join(""), "New text");
    font = "18px sans-serif";
    resize(100.25);
    assert.equal(layouts.length, 5);
    fontsChanged();
    assert.equal(layouts.length, 6);
    resize(100.25);
    assert.equal(layouts.length, 6);
  } finally {
    controller.destroy();
  }
  resize(90);
  assert.equal(layouts.length, 6);
});
