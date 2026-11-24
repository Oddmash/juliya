# 빠르게 시작하기

줄이야(Juliya)는 한국어, 영어, 일본어, 중국어 간체의 제목과 짧은 문장을 실제 화면 폭에 맞춰 읽기 좋은 위치에서 줄바꿈하는 라이브러리입니다.

CSS의 `word-break: keep-all`은 어절 중간에서 줄이 나뉘지 않게 합니다. 줄이야는 여기에 언어별 줄바꿈 규칙과 각 줄의 너비를 함께 고려합니다. React, Next.js, Vue, Svelte, 일반 HTML에서 사용할 수 있습니다.

## 설치

사용 중인 패키지 매니저에 맞는 명령어 하나만 실행하세요.

```package-managers
npm install @oddmash/kowrap
pnpm add @oddmash/kowrap
yarn add @oddmash/kowrap
```

Node.js 20 이상과 `Intl.Segmenter`를 지원하는 현대 브라우저를 대상으로 합니다. 패키지는 ESM을 제공하고 전역 CSS나 프레임워크 런타임을 강제로 추가하지 않습니다. React를 사용할 때는 React 18.2 이상 또는 React 19가 필요합니다.

새 이름의 `@oddmash/juliya`는 발행 예정입니다. 아래 새 API와 언어별 진입점은 신규 버전에서 제공하며, 같은 버전의 `@oddmash/kowrap`에서도 기존 및 새 API를 함께 사용할 수 있습니다. 이미 사용하고 있는 기존 버전의 동작은 바뀌지 않습니다.

## 1분 만에 적용하기

React 또는 Next.js를 사용한다면 텍스트 대신 `JuliyaText`를 렌더링하세요. 기본 언어는 한국어입니다.

```tsx
import { JuliyaText } from '@oddmash/juliya/react';

const Heading = () => (
  <JuliyaText as="h1" style={{ maxWidth: 360 }}>
    자연스러운 한국어 줄바꿈을 경험하세요.
  </JuliyaText>
);
```

별도의 화면 크기 이벤트를 등록할 필요는 없습니다. 요소의 실제 폭과 글꼴을 측정하고, 폭이나 글꼴이 바뀌면 다시 계산합니다.

다국어 앱에서는 [`JuliyaProvider`](react.md#juliyaprovider)로 i18n의 현재 언어를 하위 컴포넌트에 전달하세요. 모든 `JuliyaText`에 일일이 `locale`을 전달할 필요는 없습니다.

## 어떤 진입점을 사용하나요?

| 환경 | import 경로 | 주요 API |
| --- | --- | --- |
| JavaScript / TypeScript | `@oddmash/kowrap` | `wrap`, `splitLines`, `segmentSentences` |
| HTML / DOM (빌드 도구 사용) | `@oddmash/kowrap/dom` | `mountKowrap`, `observeKowrap` |
| React / Next.js | `@oddmash/kowrap/react` | `JuliyaText`, `useJuliya`, `JuliyaProvider` (기존 이름도 지원) |
| React Server Component | `@oddmash/kowrap/react/server` | `JuliyaSentenceText`, `SentenceText` |
| Vue 3 | `@oddmash/kowrap/vue` | `kowrapDirective` |
| Svelte | `@oddmash/kowrap/svelte` | `kowrap` |

일반 HTML에서는 [CDN 예제](dom.md)처럼 `<script type="module">` 안에서 모듈 URL을 가져오면 npm 설치 없이 시작할 수 있습니다. 기존 `/browser` 진입점은 `/dom`과 동일하게 동작합니다.

### 패키지 이름 전환

새 패키지가 발행되면 기존 이름과 신규 이름의 동일 버전은 같은 API를 제공합니다. 기존 이름을 계속 사용할 수도 있습니다.

| 기존 이름 | 신규 이름 (발행 예정) |
| --- | --- |
| `@oddmash/kowrap` | `@oddmash/juliya` |
| `@oddmash/kowrap/ko`, `/en`, `/ja`, `/zh` | `@oddmash/juliya/ko`, `/en`, `/ja`, `/zh` |
| `@oddmash/kowrap/react`, `/react/server` | `@oddmash/juliya/react`, `/react/server` |
| `@oddmash/kowrap/dom`, `/browser`, `/vue`, `/svelte` | `@oddmash/juliya/dom`, `/browser`, `/vue`, `/svelte` |

### 어떤 방식으로 적용할까요?

- 브라우저 제목에 바로 적용하려면 일반 HTML에서는 `mountKowrap`, React와 Next.js에서는 `JuliyaText`를 사용하세요. 컴포넌트나 어댑터가 요소의 실제 폭과 글꼴을 읽습니다.
- 직접 만든 렌더러에서 줄 목록이 필요하면 브라우저에서는 `observeKowrap`을 쓰세요. DOM 요소 없이 계산하거나 다른 곳에서 폭을 제공한다면 `wrap`을 사용하세요.
- 서버와 브라우저 첫 화면을 일치시켜야 한다면 [SSR과 하이드레이션](ssr.md)의 초기 렌더링 예제를 참고하세요. 브라우저에서 측정이 끝나면 최종 줄 위치가 정해집니다.

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
