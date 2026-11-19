# React와 Next.js

React에서는 레이아웃에 직접 사용하는 `WrapText`와 렌더링을 직접 구성하는 `useKowrap` 훅을 제공합니다. Next.js에서도 같은 패키지를 사용합니다.

## WrapText

```tsx
import { WrapText } from '@oddmash/kowrap/react';

const Title = ({ text }: { text: string }) => (
  <WrapText as="h1" className="hero-title" style={{ maxWidth: 360 }}>
    {text}
  </WrapText>
);
```

| prop | 기본값 | 역할 |
| --- | --- | --- |
| `children` | 필수 | 문자열 또는 중첩 인라인 JSX |
| `as` | `span` | span, p, div, h1부터 h6 중 선택 |
| `strategy` | `balanced` | 줄바꿈 전략 |
| `breakLongWords` | `true` | 긴 어절 분리 여부 |
| `forcedBreaks` | 없음 | 강제 줄바꿈 위치 |
| `style`, `className` | 없음 | 사용자 스타일 및 HTML 속성 |

`WrapText`는 기본적으로 block 레이아웃, `white-space: pre-wrap`, `word-break: keep-all`을 적용합니다. 자체 레이아웃 CSS로 덮어쓸 수 있지만 정확한 측정을 위해 요소가 콘텐츠 폭을 갖도록 해야 합니다.

## 동적 텍스트

```tsx
<WrapText as="p" forcedBreaks={text.indexOf('한국어') > 0 ? [text.indexOf('한국어')] : []}>
  {text}
</WrapText>
```

텍스트가 바뀌면 강제 경계도 함께 계산합니다.

## 인라인 JSX

```tsx
<WrapText as="p">
  읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과{' '}
  <a href="/docs/">문서</a>를 만나보세요.
</WrapText>
```

태그의 스타일, 속성 및 이벤트를 유지하면서 텍스트의 계산된 글꼴을 사용합니다. 서버에서는 원래 JSX와 명시적·강제 개행을 렌더링하고 하이드레이션 후 자동 개행을 계산합니다. `useKowrap`은 문자열용 훅입니다.

## useKowrap 사용법

기본 컴포넌트가 제공하는 DOM 출력 대신 애플리케이션이 직접 렌더링할 수 있습니다.

```tsx
'use client';

import { Fragment } from 'react';
import { useKowrap } from '@oddmash/kowrap/react';

const CustomText = ({ text }: { text: string }) => {
  const { ref, lines, measured, setForcedBreaks, clearForcedBreaks } = useKowrap({ text });

  return (
    <section>
      <p ref={ref} style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>
        {lines.map((line, index) => (
          <Fragment key={line.start}>
            {line.text}{line.breakAfter || (index < lines.length - 1 ? <br /> : null)}
          </Fragment>
        ))}
      </p>
      <button type="button" onClick={() => {
        const offset = text.indexOf('한국어');
        if (offset > 0) setForcedBreaks([offset]);
      }}>개행 지정</button>
      <button type="button" onClick={clearForcedBreaks}>자동 개행</button>
      <span>{measured ? '측정 완료' : '초기 상태'}</span>
    </section>
  );
};
```

`ref`는 실제 글의 폭과 글꼴이 적용되는 요소에 연결해야 합니다. 훅은 `lines`, `measured`, `forcedBreaks`와 제어 함수를 반환합니다.

### 제어형과 비제어형

비제어형은 `initialForcedBreaks`를 전달하고 훅의 `setForcedBreaks`로 내부 상태를 업데이트합니다. 제어형은 부모가 `forcedBreaks` 배열을 관리하고 `onForcedBreaksChange`로 값을 갱신합니다.

```tsx
const [breaks, setBreaks] = useState<readonly number[]>([]);
const layout = useKowrap({
  text,
  forcedBreaks: breaks,
  onForcedBreaksChange: setBreaks,
});
```

## Next.js App Router

`WrapText`는 공개 진입점에 Client Component 경계가 설정되어 있으므로 일반적인 Server Component에서 가져와 사용할 수 있습니다. 훅을 직접 사용하는 컴포넌트는 `use client` 선언이 필요합니다.

```tsx
import { WrapText } from '@oddmash/kowrap/react';
import { SentenceText } from '@oddmash/kowrap/react/server';

const Page = () => (
  <main>
    <WrapText as="h1">한국어 제목입니다.</WrapText>
    <SentenceText as="p">첫 문장입니다. 다음 문장입니다.</SentenceText>
  </main>
);

export default Page;
```

`SentenceText`는 브라우저 API나 React 훅을 필요로 하지 않습니다. 자세한 동작은 [SSR 문서](ssr.md)를 확인하세요.
