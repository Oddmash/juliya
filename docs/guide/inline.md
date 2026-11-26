# 인라인 마크업

강조, 링크, 색상 등 문장 중간의 마크업을 유지하면서 줄바꿈을 계산합니다.

## React와 Next.js

```tsx
import { JuliyaText } from '@oddmash/juliya/react';

<JuliyaText as="p">
  읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과{' '}
  <a href="/docs/">문서</a>를 만나보세요.
</JuliyaText>
```

## 일반 HTML

```ts
import { mountKowrap } from '@oddmash/juliya/dom';

const controller = mountKowrap(element, { inline: true });
```

Vue에서는 `v-kowrap="{ inline: true }"`, Svelte에서는 `use:kowrap={{ inline: true }}`를 사용합니다.

## 개행과 측정

명시적인 `<br>`과 문자열 개행은 유지합니다. `forcedBreaks`는 태그를 제외한 전체 텍스트의 UTF-16 위치이며 `<br>`은 개행 문자 하나로 계산합니다. 각 텍스트 범위의 계산된 글꼴과 문자 간격을 활용합니다.

지원 대상은 일반 텍스트 인라인 요소입니다. 이미지, 블록 요소, 의사 요소, 커스텀 React 컴포넌트의 내부 출력은 지원 범위에 포함되지 않습니다.

## 첫 화면과 글꼴 로딩

클라이언트에서 늦게 마운트하면 브라우저 기본 줄바꿈이 먼저 표시될 수 있습니다. 화면에 보이는 텍스트는 가능한 한 일찍 마운트하고, 지연 마운트가 필요한 경우 뷰포트에 들어오기 전에 충분한 여유를 두세요. 웹 글꼴은 필요한 경우 preload하고 적절한 fallback 글꼴을 지정합니다. `document.fonts.ready`를 기다려 첫 측정을 시작하는 방식은 글꼴 변경에 따른 재계산을 줄일 수 있지만, 마운트가 늦어지는 단점이 있습니다. 텍스트를 숨기지 않고 접근 가능한 기본 줄바꿈을 유지하세요.
