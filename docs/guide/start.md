# 빠르게 시작하기

kowrap은 한국어 제목과 짧은 문장을 실제 폭에 맞춰 읽기 좋은 위치에서 줄바꿈하는 라이브러리입니다. React, Next.js, Vue, Svelte 또는 프레임워크 없는 JavaScript에서 같은 코어를 사용할 수 있습니다.

## 설치

```bash
npm install @oddmash/kowrap
```

pnpm이나 Yarn을 사용해도 됩니다.

```bash
pnpm add @oddmash/kowrap
yarn add @oddmash/kowrap
```

Node.js 20 이상과 `Intl.Segmenter`를 지원하는 현대 브라우저를 대상으로 합니다. 패키지는 ESM을 제공하고 전역 CSS나 프레임워크 런타임을 강제로 추가하지 않습니다. React를 사용할 때는 React 18.2 이상 또는 React 19가 필요합니다.

## 어떤 진입점을 사용하나요?

| 환경 | import 경로 | 주요 API |
| --- | --- | --- |
| JavaScript / TypeScript | `@oddmash/kowrap` | `wrap`, `splitLines`, `segmentSentences` |
| 일반 HTML | `@oddmash/kowrap/dom` | `mountKowrap`, `observeKowrap` |
| React / Next.js | `@oddmash/kowrap/react` | `WrapText`, `useKowrap` |
| React Server Component | `@oddmash/kowrap/react/server` | `SentenceText` |
| Vue 3 | `@oddmash/kowrap/vue` | `kowrapDirective` |
| Svelte | `@oddmash/kowrap/svelte` | `kowrap` |

기존 `/browser` 진입점은 `/dom`과 동일하게 동작합니다. React, Vue, Svelte를 사용하지 않는 프로젝트에서도 코어와 DOM 모듈을 독립적으로 사용할 수 있습니다.

## React 첫 예제

```tsx
import { WrapText } from '@oddmash/kowrap/react';

const Heading = () => (
  <WrapText as="h1" style={{ maxWidth: 360 }}>
    자연스러운 한국어 줄바꿈을 경험하세요.
  </WrapText>
);
```

컴포넌트는 요소의 콘텐츠 폭과 계산된 글꼴을 읽고, 폭이나 폰트가 달라지면 줄바꿈을 다시 계산합니다. 텍스트 요소는 실제로 측정 가능한 폭을 가져야 합니다.

## JavaScript 첫 예제

```ts
import { wrap } from '@oddmash/kowrap';

const text = '오늘은 모든 사람이 함께 자연스럽게 줄바꿈합니다.';
const lines = wrap(text, {
  width: 14,
  measure: (value) => [...value].length,
});

console.log(lines.map((line) => line.text.trimEnd()));
```

이 예제는 문자 수를 폭으로 사용하는 간단한 테스트입니다. 실제 화면의 픽셀 너비에 맞추려면 [DOM 측정과 HTML](dom.md)이나 프레임워크별 어댑터를 사용하세요.

## 다음 단계

- [코어 API](core.md)에서 줄바꿈 옵션과 결과 구조를 확인합니다.
- [강제 줄바꿈](forced-breaks.md)으로 의도적인 개행을 보존합니다.
- [React와 Next.js](react.md), [Vue](vue.md), [Svelte](svelte.md) 중 환경에 맞는 예제를 확인합니다.
- [SSR과 하이드레이션](ssr.md)에서 서버 렌더링 조건을 살펴봅니다.
