# 줄이야 (Juliya) 개발 지침

Follow the [Oddmash concurrent work claims](https://github.com/Oddmash/.github/blob/main/AGENTS.md#concurrent-work-claims) and organization collaboration rules before implementation, review, CI retries, or merges.

Oddmash의 [공통 작업 기준](https://github.com/Oddmash/.github/blob/main/AGENTS.md)을 따른다. README의 기본 언어는 영어이며 한국어, 일본어, 중국어 간체 번역은 `docs/readme/`에서 관리한다. 네 언어의 제품 소개, 공개 API 예제, 지원 범위 및 이전 안내를 동기화한다. 기여 문서는 한국어로 유지하고 공개 기여 양식은 영어를 사용한다.

- README는 제품 소개, 실제 줄바꿈 예시와 지원 범위만 담는다. 설치, 개발, 테스트, 릴리스는 `CONTRIBUTING.md`에 둔다.

- `@oddmash/juliya`만 향후 업데이트 및 발행 대상으로 유지한다. `@oddmash/kowrap@0.4.0`은 최종 레거시 릴리스이며 기존 버전은 보존한다. Juliya의 공개 API, 한국어 기본 동작과 기존 컴포넌트·훅 별칭을 유지한다. `./browser`는 `./dom`의 호환 경로이며 `./ko`, `./en`, `./ja`, `./zh`를 제공한다.
- 한국어, 영어, 일본어, 중국어 간체의 줄바꿈 규칙은 명시적인 locale로 선택한다. 원문과 UTF-16 범위, grapheme 경계, 기존 강제 개행 및 SSR 계약을 보존한다.
- 엔진 구현은 `src/core/`에 둔다. DOM, React, 디자인 시스템에 의존하지 않는다. 경계 생성·언어 점수·레이아웃 전략·원문 복원을 분리한다.
- 일반 HTML과 브라우저 측정·관찰·렌더링은 `src/dom/`, 각 프레임워크는 `src/adapters/<framework>/`에서 관리한다. 사용 예시는 `examples/`에 둔다.
- 내부 모듈은 공개 배럴을 경유하지 않는다. 서버 진입점은 클라이언트 런타임을 참조하지 않는다. 자세한 구조는 `docs/ARCHITECTURE.md`를 따른다.
- 일반 HTML, Vue, Svelte는 공통 브라우저 컨트롤러를 사용한다. 모든 강제 줄바꿈 정책은 코어에서 처리하며 어댑터에 중복하지 않는다.
- 다른 저장소의 구현은 요구사항과 동작을 이해하는 참고 자료로만 사용한다. 소스 코드와 기존 테스트 구현을 복제하지 않는다.
- Next.js App Router의 서버·클라이언트 경계를 유지하고 SSR과 초기 하이드레이션 결과를 동일하게 만든다.
- 줄바꿈 알고리즘 변경 시 원문 복원, 어절·grapheme 보존, 폭 제한, 빈 문자열, 명시적 개행 테스트를 유지한다.
- 배포 전 `pnpm test`, `pnpm test:hydration`, `pnpm test:frameworks`, `pnpm test:browser`, `pnpm test:package`를 확인한다.
- 라이선스와 npm 공개 배포는 프로젝트 소유자의 결정을 따른다.
- 안정 릴리스 태그는 `vX.Y.Z` 형식이며 태그 시점의 `package.json` 버전과 동일해야 한다. 릴리스 노트는 `docs/releases/`와 `CHANGELOG.md`를 함께 갱신하며 기존 태그를 덮어쓰지 않는다.
- 문서 사이트는 `site/`의 Next.js 정적 export로 관리한다. 사용자용 한국어 문서 원본은 `docs/guide/`의 Markdown이며 사이트는 빌드 시 원본을 읽는다. 영어, 일본어, 중국어 간체 문서의 설명과 예제는 `site/lib/translated-guides.ts`에서 같은 공개 API 계약으로 관리한다. 배포 산출물 `site/out`은 npm 패키지에 포함하지 않는다.
- 사이트 디자인은 [Oddmash UI 작업 기준](https://github.com/Oddmash/oddmash-ui/blob/main/AGENTS.md)을 따르며 카본 블랙과 중립 회색, 밝은 텍스트를 기본으로 사용한다. `site/theme/tokens.json`에 사이트 토큰을 관리한다. 파란색은 포커스, 빨간색은 오류에 사용한다. 긴 대시를 장식 문자로 사용하지 않는다. 첫 화면에는 하나의 실제 줄바꿈 시연을 표시하고 벤치마크는 기술 참고 영역에만 둔다. 비교 예제와 대응 코드는 동기화하며 이동 경로는 측정된 실제 위치를 기반으로 한다.

## Public contribution language

Write issue and pull request titles, bodies, public review discussions, commit messages, and changelog entries in English. Use the shared English issue and PR templates from [Oddmash](https://github.com/Oddmash/.github/blob/main/CONTRIBUTING.md). Preserve existing product documentation localization and provide translation help when needed.

Follow the [Oddmash review follow-up guidance](https://github.com/Oddmash/.github/blob/main/docs/AI-CODE-REVIEW.md#following-up-on-review-findings) when addressing review comments, including recording non-adoption or deferral and the final thread disposition.

## Agent contribution attribution

Follow the [Oddmash agent attribution convention](https://github.com/Oddmash/.github/blob/main/AGENTS.md#agent-contribution-attribution). When a commit materially incorporates a verified finding or recommendation from Reviewer, Impact, Triage, QA, Release, Docs, or Architect, append the canonical `Co-authored-by` trailer for each actual contributing GitHub account. Deduplicate trailers, preserve human authorship and record the source role or discussion for shared identities. Do not credit unused advice or rewrite published history.
