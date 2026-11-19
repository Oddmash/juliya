# kowrap 개발 및 기여 안내

제품 개요는 [README](README.md), 공통 기여 절차는 [Oddmash 기여 안내](https://github.com/Oddmash/.github/blob/main/CONTRIBUTING.md)를 참고하세요.

## 기능

- 기본적으로 한국어 어절과 Unicode grapheme을 보존합니다.
- 줄 수를 우선 최소화한 뒤, 줄 길이의 편차와 문장·구 경계에 따른 비용으로 줄바꿈을 선택합니다.
- 긴 어절이 한 줄에 들어가지 않을 때만 grapheme 경계에서 나눕니다.
- 원문 복원에 필요한 UTF-16 범위와 명시적 줄바꿈을 반환합니다.
- React SSR, Next.js App Router의 Server/Client Component 경계를 지원합니다.

## 설치

Node.js 20 이상이 필요합니다. 로컬 개발 환경을 준비합니다.

```bash
pnpm install
pnpm build
```

## JavaScript / TypeScript

```ts
import { wrap } from '@oddmash/kowrap';

const lines = wrap('오늘은 모든 사람이 함께 자연스럽게 줄바꿈합니다.', {
  width: 14,
  measure: (text) => [...text].length,
});
```

위 예시는 문자 수를 폭으로 사용하는 간단한 예시입니다. 실제 화면에서는 픽셀 단위 측정 함수를 전달합니다.

```ts
import { wrap } from '@oddmash/kowrap';
import { createCanvasMeasure } from '@oddmash/kowrap/browser';

const measure = createCanvasMeasure({ font: '400 18px sans-serif' });
const lines = wrap('한국어와 English를 함께 사용합니다.', { width: 240, measure });
```

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `width` | 필수 | 한 줄 최대 폭 |
| `measure` | 필수 | 문자열의 폭을 반환하는 함수 |
| `strategy` | `balanced` | 균형 최적화 또는 `greedy` |
| `breakLongWords` | `true` | 지나치게 긴 어절을 grapheme 단위로 줄바꿈 |

`WrappedLine`은 `text`, `start`, `end`, `width`, `breakAfter`를 제공합니다. `width`는 줄 끝의 일반 공백을 제외하고 측정합니다. 각 `text + breakAfter`를 이어 붙이면 입력 문자열을 복원할 수 있습니다.

`segmentSentences(text, locale?)`는 원문 범위를 유지하며 문장을 분리합니다.

## React / Next.js

```tsx
import { WrapText } from '@oddmash/kowrap/react';
import { SentenceText } from '@oddmash/kowrap/react/server';

const Page = () => (
  <main>
    <WrapText as="h1" style={{ maxWidth: 480 }}>
      모든 사람이 자연스러운 한국어 줄바꿈을 경험할 수 있도록
    </WrapText>
    <SentenceText as="p">
      한국어 문장입니다. 문장 사이에서 먼저 줄을 바꿉니다.
    </SentenceText>
  </main>
);

export default Page;
```

별도 Next.js 설정이나 전역 CSS는 필요하지 않습니다.

- `WrapText`는 Next.js의 Client Component입니다. 최초 SSR과 하이드레이션에서 동일한 원문을 그린 후 실제 브라우저 폭, 글꼴과 리사이즈를 반영합니다.
- `SentenceText`는 브라우저 API와 React Hook을 사용하지 않아 Server Component에서 그대로 사용할 수 있습니다. JavaScript 없이도 CSS로 문장 단위 줄바꿈을 제공합니다.
- `wrap`과 `segmentSentences`는 React 없이 Node.js와 Server Component에서 실행할 수 있습니다. React는 선택적 peer dependency입니다.

## 현재 범위

`WrapText`는 일반 텍스트를 대상으로 하며 인라인 JSX 마크업은 아직 지원하지 않습니다. 정확한 글자 폭은 서버에서 알 수 없으므로 SSR 최초 화면에서는 CSS 줄바꿈을 사용합니다. 첫 하이드레이션 후 줄 위치가 달라질 수 있습니다. 별도 사전 하이드레이션 스크립트는 주입하지 않습니다.

Canvas 폭 측정은 브라우저 지원에 따라 글자 간격, 탭, 복잡한 폰트 기능에서 실제 DOM 레이아웃과 약간 다를 수 있습니다. 커스텀 측정 함수는 문자열이 늘어날수록 폭이 대체로 증가한다고 가정합니다. 한국어 수식 관계 판정은 형태소 분석이 아닌 휴리스틱이며, 긴 본문보다 제목·짧은 문단 최적화에 적합합니다.

Node.js 20 이상과 `Intl.Segmenter`를 지원하는 현대 브라우저를 대상으로 합니다.

## 디자인 시스템 연동

향후 디자인 시스템에서 사용할 때는 이 패키지를 런타임 의존성으로 선언하고 번들에 포함하지 않는 방식이 적합합니다. 호환 가능한 버전 범위 안의 로직 변경은 kowrap만 배포하고 소비 프로젝트의 lockfile을 갱신하면 적용할 수 있습니다. 기존 디자인 시스템은 이 저장소에서 변경하지 않습니다.

## 검증

```bash
pnpm test
pnpm build
pnpm --dir test/next-app install --no-frozen-lockfile
pnpm test:hydration
pnpm test:next
pnpm --dir test/next-app exec playwright install chromium
pnpm test:browser
pnpm test:package
```

코어 테스트, SSR 렌더링, React 하이드레이션, Next.js 정적·동적 렌더링 빌드와 Chromium 반응형 통합 테스트를 제공합니다.

## npm 릴리스

최초 패키지 등록 이후 릴리스는 GitHub Actions의 `Publish npm package` 워크플로에서 수동 실행합니다. `main` 브랜치에서 `package.json`의 버전을 입력하고 처음에는 `publish`를 끈 상태로 검증할 수 있습니다. 모든 테스트를 통과한 tarball만 발행됩니다.

npm의 Trusted Publisher는 다음 값으로 구성합니다.

| 항목 | 값 |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `Oddmash` |
| Repository | `kowrap` |
| Workflow filename | `publish.yml` |
| Environment | 비워 둠 |
| Allowed actions | `npm publish` 허용 |

새 패키지는 Trusted Publisher를 연결하기 전에 npm에서 패키지를 생성해야 할 수 있습니다. 최초 버전이 아직 없다면 소유자가 npm 로그인 및 2FA로 초기 발행한 후 OIDC를 연결합니다. 같은 버전은 다시 발행할 수 없으므로 다음 릴리스의 버전을 올립니다.

```bash
npm login
npm publish --access public
```

워크플로에는 장기 npm 토큰을 사용하지 않습니다. OIDC 연결 후 `publish`를 켜서 실행하면 검증한 tarball을 발행합니다. 라이선스 및 공개 범위를 확정한 뒤 실제 발행을 진행하세요.

## 라이선스

독립적으로 작성된 구현입니다. 라이선스 및 최초 공개 배포 정책은 정해지는 대로 추가합니다.
