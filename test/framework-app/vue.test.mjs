import assert from "node:assert/strict";
import test from "node:test";
import { initDOM } from "./dom.mjs";
import { kowrapDirective } from "@oddmash/kowrap/vue";

test("Vue 3 mounts a directive, applies reactive options and unmounts", async () => {
  const dom = initDOM();
  const { createApp, h, ref, withDirectives, nextTick } = await import("vue");
  const text = ref("한국어 줄바꿈");
  const breaks = ref([3]);
  const app = createApp({ setup: () => () => withDirectives(h("p", { id: "target" }), [[kowrapDirective, { text: text.value, forcedBreaks: breaks.value }]]) });
  try {
    app.mount("#root");
    const node = document.getElementById("target");
    assert.equal(node.textContent, text.value);
    assert.equal(node.querySelectorAll("br").length, 1);
    breaks.value = [];
    text.value = "새로운 문장";
    await nextTick();
    assert.equal(node.textContent, text.value);
    assert.equal(node.querySelectorAll("br").length, 0);
  } finally {
    app.unmount();
    dom.window.close();
  }
});
