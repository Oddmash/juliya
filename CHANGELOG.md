# 변경 이력

## [0.4.4](docs/releases/v0.4.4.md)

- Preserve Korean adverbial modifier and predicate pairs when the same line count and width allow it.
- Avoid protecting dative and topic-marked nouns as predicates; cover narrow widths and explicit breaks.

## [0.4.3](docs/releases/v0.4.3.md)

- Revalidate inline author styles on viewport resize when generated breaks mask structural selector changes.

## [0.4.2](docs/releases/v0.4.2.md)

- Preserve Korean technical noun phrases and deduplicate plain-text resize measurements.
- Preserve unchanged inline break nodes and coalesce font and resize notifications.
- Add package discovery metadata and a localized documentation sitemap.
- Document first-paint and font-readiness tradeoffs and expand browser regression coverage.
- Adopt Oddmash UI 0.10.0 in the documentation site, stabilize the landing demonstration, improve mobile layout and localize site branding.
- Expand locale source-range and mobile browser coverage; reduce redundant build work in CI.

## [0.4.1](docs/releases/v0.4.1.md)

- Complete the migration to the Juliya package and repository.
- Switch future npm releases to Juliya trusted publishing and update package metadata and examples.
- Preserve the public API and locale behavior.

## [0.4.0](docs/releases/v0.4.0.md)

- Introduce the Juliya brand and locale-aware text wrapping for Korean, English, Japanese, and Simplified Chinese.
- Add locale subpath exports, React locale inheritance, and compatible Juliya component and hook aliases.
- Localize the landing and guides, refine measured reflow demonstrations, and retain existing Korean and framework behavior.
- License the implementation under MIT and prepare equivalent Kowrap and Juliya package artifacts.
- `@oddmash/kowrap@0.4.0` is the final legacy package release. Future updates are published as `@oddmash/juliya` only.

## [0.3.4](docs/releases/v0.3.4.md)

- Add ESLint checks for source, scripts, tests, and the documentation site.
- Require lint and contribution metadata verification in CI.
- Preserve public exports, wrapping behavior, and supported consumer runtimes.

## [0.3.3](docs/releases/v0.3.3.md)

- Prefer keeping common Korean counting expressions together when a layout with the same line count fits.
- Preserve original text, width constraints, greedy behavior, and the public API.
- Add regression cases from real Boundra documentation and constrained-width layouts.

## [0.3.2](docs/releases/v0.3.2.md)

- Improve balanced wrapping around common Korean modifiers, nouns, and mixed-language technical phrases such as `CSS import`.
- Keep the minimum-line-count constraint and preserve existing greedy behavior, source text, and public API compatibility.
- Add eight real portfolio paragraphs with 88 proportional-width regression cases, plus Chromium, Firefox, and WebKit integration coverage.

## [0.3.1](docs/releases/v0.3.1.md)

- Refresh the README with a screenshot of the public landing and a standalone HTML example pinned to Kowrap 0.3.0 on jsDelivr.
- Keep the README, landing, and HTML guide examples in sync and run the copied HTML in three browser engines.
- Install all three browser engines during npm release verification.

## [0.3.0](docs/releases/v0.3.0.md)

- Preserve nested inline markup when wrapping text in React, plain HTML, Vue, and Svelte.
- Improve Korean modifier–noun grouping and measure browser content widths more accurately, including before the first resize observation.
- Refresh the landing editor and add a copy-ready HTML example, expanded guides, and a table of contents that follows the current section.

## [0.2.0](docs/releases/v0.2.0.md)

- HTML, Vue, Svelte 지원과 React 훅을 추가했습니다.
- 강제 줄바꿈과 SSR 초기 줄 분리를 지원합니다.
- 코어, DOM, 프레임워크 어댑터 구조를 재구성했습니다.
- 기존 공개 import 경로를 유지하고 `/dom`을 추가했습니다.

## [0.1.1](docs/releases/v0.1.1.md)

- 0.1.0 기반의 배포 자동화 유지보수 릴리스입니다.
- GitHub Release·npm OIDC 연결, 버전 검증, 중복 발행 방지를 추가합니다.

## [0.1.0](docs/releases/v0.1.0.md)

- 초기 한국어 줄바꿈 엔진, 브라우저 측정 및 React/Next.js SSR 지원을 공개했습니다.
