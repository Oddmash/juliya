# 인라인 마크업

강조, 링크, 색상 등 문장 중간의 마크업을 유지하면서 줄바꿈을 계산합니다.

## React와 Next.js

```tsx
import { WrapText } from '@oddmash/kowrap/react';

<WrapText as="p">
  읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과{' '}
  <a href="/docs/">문서</a>를 만나보세요.
</WrapText>
```

## 일반 HTML

```ts
import { mountKowrap } from '@oddmash/kowrap/dom';

const controller = mountKowrap(element, { inline: true });
```

Vue에서는 `v-kowrap="{ inline: true }"`, Svelte에서는 `use:kowrap={{ inline: true }}`를 사용합니다.

## 개행과 측정

명시적인 `<br>`과 문자열 개행은 유지합니다. `forcedBreaks`는 태그를 제외한 전체 텍스트의 UTF-16 위치이며 `<br>`은 개행 문자 하나로 계산합니다. 각 텍스트 범위의 계산된 글꼴과 문자 간격을 활용합니다.

지원 대상은 일반 텍스트 인라인 요소입니다. 이미지, 블록 요소, 의사 요소, 커스텀 React 컴포넌트의 내부 출력은 지원 범위에 포함되지 않습니다.
