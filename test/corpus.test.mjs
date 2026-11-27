import test from "node:test";
import assert from "node:assert/strict";
import { wrap } from "@oddmash/juliya";
import { corpus, evaluate, minimumLinesKeeping, models, validatePreferredPhrases } from "./corpus/evaluate.mjs";

test("distinguishes feasible phrase preservation from line-budget conflicts", () => {
  const text = "가나 다라 마바 사아";
  const range = { start: 3, end: 8 };
  assert.equal(minimumLinesKeeping(text, 5, models.monospace, "ko", []), 2);
  assert.equal(minimumLinesKeeping(text, 5, models.monospace, "ko", [range]), 3);
  assert.equal(minimumLinesKeeping(text, 8, models.monospace, "ko", [range]), 2);
  assert.equal(minimumLinesKeeping("가나\n다라", 10, models.monospace, "ko", [{ start: 0, end: 5 }]), Infinity);
});

test("development: keeps the inflected predicate in ko-mill at the existing line budget", () => {
  const fixture = corpus.find(item => item.id === "ko-mill");
  const result = evaluate(wrap, fixture, 12, models.monospace, "balanced");
  assert.equal(result.lineCount, 8);
  assert.equal(result.avoidablePhraseSplits, 0);
  assert.ok(wrap(fixture.text, { width: 12, measure: models.monospace, locale: "ko" }).some(line => line.text.includes("한적하게 비칠")));
});

test("literature fixtures preserve provenance and disjoint work-level evaluation splits", () => {
  const ids = new Set();
  const works = new Map();
  const authors = new Map();
  for (const item of corpus) {
    assert.ok(!ids.has(item.id));
    ids.add(item.id);
    assert.ok(item.text && item.author && item.rights && item.transformation && item.license && item.checkedOn);
    assert.ok(["development", "holdout"].includes(item.split));
    validatePreferredPhrases(item);
    if (item.kind !== "literature") continue;
    assert.ok(item.source.startsWith("https://") && item.rightsEvidence.startsWith("https://"));
    assert.ok(item.publication && item.authorDeath && item.attribution);
    if (item.source.includes("wikisource.org")) assert.match(item.source, /[?&]oldid=\d+/);
    if (item.source.includes("gutenberg.org")) {
      assert.match(item.source, /^https:\/\/www\.gutenberg\.org\/ebooks\/\d+$/);
      assert.ok(item.sourceEdition);
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

test("rejects invalid phrase annotations before evaluating original fixtures", () => {
  const fixture = { id: "synthetic-original", kind: "original", locale: "ko", split: "development", text: "쉽게 읽는다." };
  for (const invalid of [
    { ...fixture, preferredPhrases: [""] },
    { ...fixture, preferredPhrases: ["없는 문구"] },
    { ...fixture, split: "holdout", preferredPhrases: ["쉽게"] },
  ]) {
    assert.throws(() => evaluate(wrap, invalid, 12, models.monospace, "balanced"), /Invalid preferred phrase annotations/);
  }
  assert.doesNotThrow(() => evaluate(wrap, { ...fixture, preferredPhrases: ["쉽게"] }, 12, models.monospace, "balanced"));
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
