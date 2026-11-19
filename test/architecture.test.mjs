import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import * as browser from "@oddmash/kowrap/browser";
import * as dom from "@oddmash/kowrap/dom";

const source = new URL("../src/", import.meta.url);
const filesIn = (directory) => readdirSync(new URL(`${directory}/`, source), { withFileTypes: true }).filter((item) => item.isFile());

test("source root contains one public entrypoint and three responsibility layers", () => {
  assert.deepEqual(readdirSync(source).filter((name) => !name.startsWith(".")).sort(), ["adapters", "core", "dom", "index.ts"]);
});

test("core and DOM never depend on framework adapters", () => {
  for (const directory of ["core", "dom"]) {
    for (const file of filesIn(directory)) {
      const text = readFileSync(new URL(`${directory}/${file.name}`, source), "utf8");
      assert.doesNotMatch(text, /\b(?:from\s+|import\s*)["'](?:react|vue|svelte|[^"']*\/adapters\/)/);
      if (directory === "core") {
        assert.doesNotMatch(text, /\b(?:from\s+|import\s*)["'][^"']*\/dom\//);
        assert.doesNotMatch(text, /\b(?:window|document|HTMLElement|ResizeObserver)\b/);
      }
    }
  }
});

test("browser and DOM import paths expose the same API", () => {
  assert.equal(browser.mountKowrap, dom.mountKowrap);
  assert.equal(browser.observeKowrap, dom.observeKowrap);
  assert.equal(browser.createCanvasMeasure, dom.createCanvasMeasure);
});

test("the HTML demo directly imports the compiled DOM entrypoint", () => {
  const example = new URL("../examples/html/index.html", import.meta.url);
  const html = readFileSync(example, "utf8");
  const path = html.match(/import\s*\{\s*mountKowrap\s*\}\s*from\s*['"]([^'"]+)['"]/);
  assert.ok(path);
  assert.ok(existsSync(new URL(path[1], example)));
});
