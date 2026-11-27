# Multilingual prose corpus

This test-only corpus contains one short original-language excerpt from each of 40 public-domain works (10 each for Korean, English, Japanese and Simplified Chinese), and eight original contemporary UI/technical fixtures. It is a seed evaluation corpus, not a collection of complete books or an assertion of linguistic fluency.

## Rights and provenance

- Review date: 2026-11-27. Each item records the work, author, original publication, author death where known, exact source edition or revision, source rights evidence, credit, license and any transformation.
- The seed deliberately uses old originals published before 1931 and authors whose economic rights have expired under the relevant Korean life-plus-70 rule. Do not infer clearance from a free download, the title alone, or a US public-domain tag. Check the exact edition, publication history, any translators/editors and all relevant distribution jurisdictions before adding material.
- Wikisource excerpts keep the credited author and source revision or edition link. Any copyrightable source transcription is retained under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), not relicensed under the project's MIT code license; excerpting and the Simplified Chinese display conversion are disclosed.
- Aozora Bunko excerpts follow its [file handling policy](https://www.aozora.gr.jp/guide/kijyunn.html), with the supplied edition, input/proofing and date credits. Only original prose is used, with ruby readings and editorial notes excluded.
- Project Gutenberg excerpts are from original prose, not ebook packaging or modern annotations. See its [permission guidance](https://www.gutenberg.org/policy/permission.html), [source terms](https://www.gutenberg.org/policy/license.html), and [linking guidance](https://www.gutenberg.org/policy/linking.html). Use the ebook catalog URL rather than a direct link to an ebook file; the manifest records the edition/file identifier separately. The source name is attribution only; no endorsement or trademark license is implied.
- For Korean rights consult the [Korea Copyright Commission's public-domain guidance](https://gongu.copyright.or.kr/gongu/main/contents.do?menuNo=200091); the [US Copyright Office](https://www.copyright.gov/what-is-copyright/index.html) explains the US publication cutoff. The above is a conservative corpus selection policy, not a guarantee in every jurisdiction. Exclude any uncertain work until its source and rights are established.
- Keep this directory out of library runtime imports, generated dist and npm tarballs. Do not bulk scrape source websites or add modern translations, copyrighted illustrations, covers or novel text without revision-specific clearance. Source links are for manual verification; none of the tests require network access.

### Exact-excerpt provenance review (2026-11-27)

- All 40 literary passages were checked against their recorded original-language source editions. Korean Wikisource (10), English Wikisource (2), and Chinese Wikisource (10) were matched against pinned revisions; Chinese display conversion is explicit. Aozora Bunko (10) matched after excluding ruby readings, and edition/input/proofing credits were inspected.
- The Gutenberg origin served a maintenance response. Seven excerpts matched the corresponding ebook IDs on the independent public OSS Planet mirror; the remaining `en-pride` excerpt matched the indexed 1998 text version of ebook 1342. The newer illustrated mirror edition differs in punctuation, so the manifest identifies the older text version instead. Ebook catalog records and available credit notices supported the recorded provenance. The live Gutenberg file URLs were unavailable on the review date; do not represent the mirror or cached check as a live-origin check.
- No excerpt text or development/holdout assignment changed during this audit. Rights conclusions concern original prose only, not translations, annotations, illustrations or the source sites' branding. Source-specific license obligations are retained.
- The repository package allowlist and tarball verification restrict distribution to `dist/`, package metadata, README, NOTICE and LICENSE. Corpus fixtures are test-only and excluded from npm output and runtime imports.

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
