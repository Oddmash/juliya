import test from "node:test";
import assert from "node:assert/strict";
import { wrap } from "@oddmash/juliya";
import { corpus, evaluate, models } from "./corpus/evaluate.mjs";

test("literature fixtures preserve provenance and disjoint work-level evaluation splits", () => {
  const ids = new Set();
  const works = new Map();
  const authors = new Map();
  for (const item of corpus) {
    assert.ok(!ids.has(item.id));
    ids.add(item.id);
    assert.ok(item.text && item.author && item.rights && item.transformation && item.license && item.checkedOn);
    assert.ok(["development", "holdout"].includes(item.split));
    if (item.kind !== "literature") continue;
    assert.ok(item.source.startsWith("https://") && item.rightsEvidence.startsWith("https://"));
    assert.ok(item.publication && item.authorDeath && item.attribution);
    if (item.preferredPhrases) {
      assert.equal(item.split, "development");
      assert.ok(item.preferredPhrases.every(phrase => phrase.length > 0 && item.text.includes(phrase)));
    }
    const work = `${item.author}/${item.title}`;
    if (works.has(work)) assert.equal(works.get(work), item.split);
    works.set(work, item.split);
    if (authors.has(item.author)) assert.equal(authors.get(item.author), item.split);
    authors.set(item.author, item.split);
  }
  for (const locale of ["ko", "en", "ja", "zh"]) {
    assert.ok(new Set(corpus.filter(item => item.locale === locale && item.kind === "literature").map(item => item.title)).size >= 10);
    for (const split of ["development", "holdout"]) {
      assert.ok(corpus.some(item => item.locale === locale && item.kind === "literature" && item.split === split));
    }
    assert.ok(corpus.some(item => item.locale === locale && item.kind === "original"));
  }
});

for (const fixture of corpus) {
  test(`corpus: ${fixture.id}`, () => {
    for (const measure of Object.values(models)) {
      for (const width of [8, 12, 20, 32, 48, 64]) {
        for (const text of [fixture.text, `${fixture.text}\n\n${fixture.text}`]) {
          const input = { ...fixture, text };
          const balanced = evaluate(wrap, input, width, measure, "balanced");
          const greedy = evaluate(wrap, input, width, measure, "greedy");
          for (const result of [balanced, greedy]) {
            assert.ok(result.restored && result.ranges && result.graphemeSafe, JSON.stringify(result));
            assert.ok(result.overflow <= Number.EPSILON, JSON.stringify(result));
          }
          assert.ok(balanced.lineCount <= greedy.lineCount, JSON.stringify({ balanced, greedy }));
        }
      }
    }
  });
}

for (const locale of ["ko", "en", "ja", "zh"]) {
  for (const split of ["development", "holdout"]) {
    test(`corpus: long ${locale} ${split} paragraph batch`, () => {
      const text = corpus.filter(item => item.locale === locale && item.split === split).map(item => item.text).join("\n\n");
      const fixture = { id: `${locale}-${split}-batch`, locale, split, text };
      for (const width of [12, 32, 64]) {
        const balanced = evaluate(wrap, fixture, width, models.proportional, "balanced");
        const greedy = evaluate(wrap, fixture, width, models.proportional, "greedy");
        for (const result of [balanced, greedy]) {
          assert.ok(result.restored && result.ranges && result.graphemeSafe, JSON.stringify(result));
          assert.ok(result.overflow <= Number.EPSILON, JSON.stringify(result));
        }
        assert.ok(balanced.lineCount <= greedy.lineCount);
      }
    });
  }
}

