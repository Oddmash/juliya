# kowrap 개발 지침

Oddmash의 [공통 작업 기준](https://github.com/Oddmash/.github/blob/main/AGENTS.md)을 따른다. 현재 제품의 주요 사용자가 한국어 사용자이므로 README와 기여 문서는 한국어로 유지한다. 필요할 때만 추가 언어를 지원한다.

- README는 제품 소개, 실제 줄바꿈 예시와 지원 범위만 담는다. 설치, 개발, 테스트, 릴리스는 `CONTRIBUTING.md`에 둔다.

- 공개 패키지 진입점 `.`, `./browser`, `./dom`, `./react`, `./react/server`, `./vue`, `./svelte`의 API 호환성을 유지한다. `./browser`는 `./dom`의 호환 경로다.
- 엔진 구현은 `src/core/`에 둔다. DOM, React, 디자인 시스템에 의존하지 않는다. 경계 생성·언어 점수·레이아웃 전략·원문 복원을 분리한다.
- 일반 HTML과 브라우저 측정·관찰·렌더링은 `src/dom/`, 각 프레임워크는 `src/adapters/<framework>/`에서 관리한다. 사용 예시는 `examples/`에 둔다.
- 내부 모듈은 공개 배럴을 경유하지 않는다. 서버 진입점은 클라이언트 런타임을 참조하지 않는다. 자세한 구조는 `docs/ARCHITECTURE.md`를 따른다.
- 일반 HTML, Vue, Svelte는 공통 브라우저 컨트롤러를 사용한다. 모든 강제 줄바꿈 정책은 코어에서 처리하며 어댑터에 중복하지 않는다.
- 다른 저장소의 구현은 요구사항과 동작을 이해하는 참고 자료로만 사용한다. 소스 코드와 기존 테스트 구현을 복제하지 않는다.
- Next.js App Router의 서버·클라이언트 경계를 유지하고 SSR과 초기 하이드레이션 결과를 동일하게 만든다.
- 줄바꿈 알고리즘 변경 시 원문 복원, 어절·grapheme 보존, 폭 제한, 빈 문자열, 명시적 개행 테스트를 유지한다.
- 배포 전 `pnpm test`, `pnpm test:hydration`, `pnpm test:frameworks`, `pnpm test:browser`, `pnpm test:package`를 확인한다.
- 라이선스와 npm 공개 배포는 프로젝트 소유자의 결정을 따른다.
