# kowrap 개발 지침

Oddmash의 [공통 작업 기준](https://github.com/Oddmash/.github/blob/main/AGENTS.md)을 따른다. 현재 제품의 주요 사용자가 한국어 사용자이므로 README와 기여 문서는 한국어로 유지한다. 필요할 때만 추가 언어를 지원한다.

- README는 제품 소개, 실제 줄바꿈 예시와 지원 범위만 담는다. 설치, 개발, 테스트, 릴리스는 `CONTRIBUTING.md`에 둔다.

- 줄바꿈 엔진과 문장 분리는 `src/index.ts`에 유지한다. DOM, React, 디자인 시스템에 의존하지 않는다.
- 브라우저 측정은 `src/browser.ts`, React 클라이언트 기능은 `src/react.tsx`, 서버 렌더링 전용 기능은 `src/server.tsx`에서 관리한다.
- 다른 저장소의 구현은 요구사항과 동작을 이해하는 참고 자료로만 사용한다. 소스 코드와 기존 테스트 구현을 복제하지 않는다.
- Next.js App Router의 서버·클라이언트 경계를 유지하고 SSR과 초기 하이드레이션 결과를 동일하게 만든다.
- 줄바꿈 알고리즘 변경 시 원문 복원, 어절·grapheme 보존, 폭 제한, 빈 문자열, 명시적 개행 테스트를 유지한다.
- 배포 전 `pnpm test`, `pnpm test:hydration`, `pnpm test:browser`, `npm pack --dry-run`을 확인한다.
- 라이선스와 npm 공개 배포는 프로젝트 소유자의 결정을 따른다.
