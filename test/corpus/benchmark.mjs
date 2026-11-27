import { createRequire } from "node:module";
import { wrap } from "@oddmash/juliya";
import { corpus, evaluate, graphemes, models } from "./evaluate.mjs";

const split = process.argv.includes("--development") ? "development" : "holdout";
const selected = corpus.filter(item => item.split === split);
const results = [];
const record = (fixture, width, measure, model) => {
  for (const strategy of ["balanced", "greedy"]) {
    const samples = Array.from({ length: 5 }, () => evaluate(wrap, fixture, width, measure, strategy));
    const durationMs = samples.map(item => item.durationMs).sort((a, b) => a - b)[2];
    results.push({ ...samples[0], durationMs, model });
  }
};

if (process.argv.includes("--browser")) {
  const require = createRequire(new URL("../next-app/package.json", import.meta.url));
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const fixture of selected) {
      const text = fixture.text;
      const offsets = [...graphemes(text).map(unit => unit.index), text.length];
      const pieces = new Set([""]);
      for (let start = 0; start < offsets.length; start++) {
        for (let end = start + 1; end < offsets.length; end++) {
          const fragment = text.slice(offsets[start], offsets[end]);
          pieces.add(fragment);
          pieces.add(fragment.trimEnd());
        }
      }
      for (const font of ["16px sans-serif", "18px serif", "20px monospace"]) {
        const entries = await page.evaluate(({ pieces, font }) => {
          const context = document.createElement("canvas").getContext("2d");
          context.font = font;
          return pieces.map(piece => [piece, context.measureText(piece).width]);
        }, { pieces: [...pieces], font });
        const widths = new Map(entries);
        const measure = value => {
          if (!widths.has(value)) throw new Error("Unexpected measurement fragment");
          return widths.get(value);
        };
        for (const width of [160, 240, 320, 390, 693]) record(fixture, width, measure, font);
      }
    }
  } finally {
    await browser.close();
  }
} else {
  for (const fixture of selected) {
    for (const [model, measure] of Object.entries(models)) {
      for (const width of [8, 12, 20, 32, 48, 64]) record(fixture, width, measure, model);
    }
  }
}

console.log(JSON.stringify({ split, mode: process.argv.includes("--browser") ? "canvas" : "deterministic", results }, null, 2));
if (results.some(result => !result.restored || !result.ranges || !result.graphemeSafe || result.overflow > 0)) process.exitCode = 1;
