import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { compile } from "svelte/compiler";
import { initDOM } from "./dom.mjs";

test("Svelte 5 action mounts and updates through a compiled component", async () => {
  const dom = initDOM();
  const { mount, unmount, flushSync } = await import("svelte");
  const directory = await mkdtemp(join(process.cwd(), ".svelte-fixture-"));
  let instance;
  try {
    const source = `<script>
      import { kowrap } from '@oddmash/kowrap/svelte';
      let text = $state('한국어 줄바꿈');
      let breaks = $state([3]);
    </script>
    <p id="target" use:kowrap={{text, forcedBreaks: breaks}}></p>
    <button onclick={() => { text = '새로운 문장'; breaks = []; }}>변경</button>`;
    const file = join(directory, "component.js");
    await writeFile(file, compile(source, { generate: "client" }).js.code);
    const { default: Component } = await import(pathToFileURL(file).href);
    instance = mount(Component, { target: document.getElementById("root") });
    flushSync();
    const node = document.getElementById("target");
    assert.equal(node.textContent, "한국어 줄바꿈");
    assert.equal(node.querySelectorAll("br").length, 1);
    document.querySelector("button").click();
    flushSync();
    assert.equal(node.textContent, "새로운 문장");
    assert.equal(node.querySelectorAll("br").length, 0);
  } finally {
    if (instance) await unmount(instance);
    await rm(directory, { recursive: true, force: true });
    dom.window.close();
  }
});
