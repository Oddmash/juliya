# Multilingual prose corpus

This test-only corpus contains one short original-language excerpt from each of 40 public-domain works (10 each for Korean, English, Japanese and Simplified Chinese), and eight original contemporary UI/technical fixtures. It is a seed evaluation corpus, not a collection of complete books or an assertion of linguistic fluency.

## Rights and provenance

- Review date: 2026-11-27. Each item records the work, author, original publication, author death where known, exact source edition or revision, source rights evidence, credit, license and any transformation.
- The seed deliberately uses old originals published before 1931 and authors whose economic rights have expired under the relevant Korean life-plus-70 rule. Do not infer clearance from a free download, the title alone, or a US public-domain tag. Check the exact edition, publication history, any translators/editors and all relevant distribution jurisdictions before adding material.
- Wikisource excerpts keep the credited author and source revision or edition link. Any copyrightable source transcription is retained under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), not relicensed under the project's MIT code license; excerpting and the Simplified Chinese display conversion are disclosed.
- Aozora Bunko excerpts follow its [file handling policy](https://www.aozora.gr.jp/guide/kijyunn.html), with the supplied edition, input/proofing and date credits. Only original prose is used, with ruby readings and editorial notes excluded.
- Project Gutenberg excerpts are from the original prose, not its ebook packaging or modern annotations. See its [permission guidance](https://www.gutenberg.org/policy/permission.html) and [source terms](https://www.gutenberg.org/policy/license.html). The source name is attribution only; no endorsement or trademark license is implied.
- For Korean rights consult the [Korea Copyright Commission's public-domain guidance](https://gongu.copyright.or.kr/gongu/main/contents.do?menuNo=200091); the [US Copyright Office](https://www.copyright.gov/what-is-copyright/index.html) explains the US publication cutoff. The above is a conservative corpus selection policy, not a guarantee in every jurisdiction. Exclude any uncertain work until its source and rights are established.
- Keep this directory out of library runtime imports, generated dist and npm tarballs. Do not bulk scrape source websites or add modern translations, copyrighted illustrations, covers or novel text without revision-specific clearance. Source links are for manual verification; none of the tests require network access.

## Evaluation

The development and holdout splits are disjoint by author and work. Use only development fixtures and provisional phrase preferences when proposing a scoring change. Run the holdout once after a candidate is frozen; do not tune to its results. Each fixture is pinned as text in the manifest so regression checks do not depend on live websites.

```sh
pnpm test
node test/corpus/benchmark.mjs --development
node test/corpus/benchmark.mjs
pnpm --dir test/next-app install --frozen-lockfile
pnpm --dir test/next-app exec playwright install chromium
node test/corpus/benchmark.mjs --browser --development
node test/corpus/benchmark.mjs --browser
```

Build the library before running the standalone benchmark. The deterministic benchmark uses two proportional/monospace models and six widths. The optional canvas benchmark uses three CSS font stacks and five pixel widths; installed fonts and fallback differ by environment, so record the actual font environment. It measures the engine with precomputed Canvas widths, not DOM painting or reflow. Runtime values are medians of five calls and are informational only, not CI pass/fail criteria.

The CI test covers source restoration, contiguous UTF-16 ranges and grapheme-safe boundaries, zero overflow at tested widths, and a balanced line count no greater than greedy. It also checks explicit newlines and a longer paragraph batch per language/split.

Reported metrics:

- Normalized line slack standard deviation (lower is more even, not inherently more readable).
- Word-interior breaks according to the runtime's Intl.Segmenter (a heuristic, not a linguistic gold standard).
- Split/eligible provisional preferred phrases, on development examples only. A phrase fitting by itself does not prove it can fit with the same total line count; inspect those examples before calling a split a defect.
- Per-strategy engine duration and line count.

The preferred phrases are candidate annotations for human language review, not asserted grammatical truth. To certify a linguistic regression, annotate exact preferred/unwanted boundaries and check feasibility against the same line-count budget with independent language review. Review development-only failures and open scoped engine issues; keep the corpus separate from scoring logic.

### Initial engine evaluation (2026-11-27)

The existing develop core passed all 57 provenance, per-fixture and paragraph-batch tests. A local offline font check measured 1,900 layouts using Pillow and installed macOS fonts (16/20px at 160, 240, 320, 390 and 693px with both strategies). One historical Korean grapheme was not supported by Apple SD Gothic Neo, so its 20 combinations were excluded rather than measured with a missing-glyph box; Arial Unicode covered the fixture. This is not browser-rendering evidence. The optional Canvas benchmark still needs its own browser run.

The development-only deterministic observations include a potential Korean preference gap: at width 12 with the monospace model, the fixture `ko-mill` splits the annotated adverbial/predicate pair in balanced mode while greedy keeps it intact with the same number of lines. The existing #185 candidate still produces the same preference counts on this development set. Do not tune that active change against holdout data; investigate the inflected predicate pattern separately after the current review completes.

## Expansion

Add new rights-verified passages across genres and lengths with a stable source revision or edition and a distinct author-level split. For full-book stress tests, keep unneeded editions outside the npm package and use independently approved, pinned texts only. The seed includes short excerpts rather than entire novels; repetition and concatenation exercise longer paragraph batches but do not substitute for full-book quality assessment.

