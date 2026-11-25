# React와 Next.js

React에서는 레이아웃에 직접 사용하는 `JuliyaText`, 렌더링을 직접 구성하는 `useJuliya` 훅, 공통 언어를 설정하는 `JuliyaProvider`를 제공합니다. Next.js에서도 같은 패키지를 사용합니다.

이 문서는 공식 패키지 `@oddmash/juliya`를 사용합니다. 기존 Kowrap 0.4.0의 공개 API를 유지합니다.

## JuliyaText

```tsx
import { JuliyaText } from '@oddmash/juliya/react';

const Title = ({ text }: { text: string }) => (
  <JuliyaText as="h1" className="hero-title" style={{ maxWidth: 360 }}>
    {text}
  </JuliyaText>
);
```

**필수 prop:** `children`만 전달하면 기본 동작을 사용할 수 있습니다.

| prop | 필수 여부 | 타입 | 기본값 | 역할 |
| --- | --- | --- | --- | --- |
| `children` | 필수 | ReactNode | 없음 | 문자열 또는 중첩 인라인 JSX |
| `as` | 선택 | TextTag | `span` | span, p, div, h1부터 h6 중 선택 |
| `locale` | 선택 | WrapLocale | Provider의 언어 또는 `ko` | 언어별 줄바꿈 규칙 |
| `strategy` | 선택 | WrapOptions["strategy"] | `balanced` | 줄바꿈 전략 |
| `breakLongWords` | 선택 | boolean | `true` | 긴 어절 분리 여부 |
| `forcedBreaks` | 선택 | readonly number[] | 없음 | 강제 줄바꿈 위치 |
| `style`, `className` | 선택 | CSSProperties / string | 없음 | 사용자 스타일 |

`JuliyaText`는 기본적으로 block 레이아웃, `white-space: pre-wrap`, `word-break: keep-all`을 적용합니다. 자체 레이아웃 CSS로 덮어쓸 수 있지만 정확한 측정을 위해 요소가 콘텐츠 폭을 갖도록 해야 합니다.

## JuliyaProvider

다국어 애플리케이션에서는 언어별 컴포넌트를 따로 선택할 필요 없이 상위에서 언어를 한 번 지정하세요.

```tsx
import { JuliyaProvider, JuliyaText } from '@oddmash/juliya/react';

const Page = () => (
  <JuliyaProvider locale="ja">
    <JuliyaText as="h1">文章を自然なリズムで読みやすく。</JuliyaText>
    <JuliyaText as="p">画面の幅に合わせて改行します。</JuliyaText>
    <JuliyaText locale="en">Read every line naturally.</JuliyaText>
  </JuliyaProvider>
);
```

`JuliyaText`와 `useJuliya` 모두 같은 우선순위로 언어를 결정합니다.

1. 컴포넌트 또는 훅의 명시적인 `locale`
2. 가장 가까운 `JuliyaProvider`의 `locale`
3. 기본 언어 `ko`

Provider를 중첩할 수 있습니다. 중첩 Provider에서 `locale`을 생략하면 상위 설정을 그대로 상속합니다. 지원하는 값은 `ko`, `en`, `ja`, `zh`, `zh-Hans`이며 `zh`와 `zh-Hans`는 중국어 간체입니다.

### i18n 연동

줄이야는 번역을 직접 수행하지 않습니다. 애플리케이션의 기존 i18n 언어 상태를 전달하면 됩니다. 예를 들어 `react-i18next`를 사용한다면 다음과 같이 지원 언어로 변환하세요.

```tsx
'use client';

import type { ReactNode } from 'react';
import type { WrapLocale } from '@oddmash/juliya';
import { JuliyaProvider } from '@oddmash/juliya/react';
import { useTranslation } from 'react-i18next';

const toJuliyaLocale = (language: string): WrapLocale => {
  const [base, ...subtags] = language.toLowerCase().split('-');
  if (base === 'ja' || base === 'en') return base;
  if (base === 'zh') {
    const traditional = subtags.some(tag => ['hant', 'tw', 'hk', 'mo'].includes(tag));
    if (!traditional) return 'zh-Hans';
  }
  return 'ko';
};

const TextProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();

  return (
    <JuliyaProvider locale={toJuliyaLocale(i18n.resolvedLanguage ?? i18n.language)}>
      {children}
    </JuliyaProvider>
  );
};
```

`en-US`, `ja-JP`와 같은 언어 태그는 그대로 전달하지 않고 지원 값으로 매핑합니다. 이 예제는 한국어, 영어, 일본어, 중국어 간체만 지원하는 앱에서 지원하지 않는 언어를 한국어 규칙으로 처리하는 정책입니다. 번체 중국어를 사용하는 앱은 별도의 대체 언어 정책을 정해야 합니다. i18n 언어가 바뀌면 Provider 하위의 줄바꿈도 재계산됩니다.

## 동적 텍스트

```tsx
<JuliyaText as="p" forcedBreaks={text.indexOf('한국어') > 0 ? [text.indexOf('한국어')] : []}>
  {text}
</JuliyaText>
```

텍스트가 바뀌면 강제 경계도 함께 계산합니다.

## 인라인 JSX

```tsx
<JuliyaText as="p">
  읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과{' '}
  <a href="/docs/">문서</a>를 만나보세요.
</JuliyaText>
```

태그의 스타일, 속성 및 이벤트를 유지하면서 텍스트의 계산된 글꼴을 사용합니다. 서버에서는 원래 JSX와 명시적·강제 개행을 렌더링하고 하이드레이션 후 자동 개행을 계산합니다. `useJuliya`는 문자열용 훅입니다.

## useJuliya 사용법

기본 컴포넌트가 제공하는 DOM 출력 대신 애플리케이션이 직접 렌더링할 수 있습니다.

```tsx
'use client';

import { Fragment } from 'react';
import { useJuliya } from '@oddmash/juliya/react';

const CustomText = ({ text }: { text: string }) => {
  const { ref, lines, measured, locale, setForcedBreaks, clearForcedBreaks } = useJuliya({ text });

  return (
    <section>
      <p ref={ref} lang={locale} style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>
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

`ref`는 실제 글의 폭과 글꼴이 적용되는 요소에 연결해야 합니다. 훅은 `lines`, `measured`, `forcedBreaks`, 결정된 `locale`과 제어 함수를 반환합니다. 직접 렌더링하는 요소에는 반환된 `locale`을 `lang` 속성으로 전달하세요.

### 훅 옵션

| 옵션 | 필수 여부 | 기본값 | 역할 |
| --- | --- | --- | --- |
| `text` | 필수 | 없음 | 줄바꿈할 문자열 |
| `locale` | 선택 | Provider의 언어 또는 `ko` | 언어별 줄바꿈 규칙 |
| `strategy` | 선택 | `balanced` | 줄바꿈 전략 |
| `breakLongWords` | 선택 | `true` | 긴 어절 분리 |
| `forcedBreaks` | 선택 | 없음 | 제어형 강제 경계 |
| `initialForcedBreaks` | 선택 | `[]` | 비제어형 초기 경계 |
| `onForcedBreaksChange` | 선택 | 없음 | 경계 변경 콜백 |
| `tag` | 선택 | `span` | 측정 태그 |
| `style`, `className` | 선택 | 없음 | 측정 스타일 |

### 제어형과 비제어형

비제어형은 `initialForcedBreaks`를 전달하고 훅의 `setForcedBreaks`로 내부 상태를 업데이트합니다. 제어형은 부모가 `forcedBreaks` 배열을 관리하고 `onForcedBreaksChange`로 값을 갱신합니다.

```tsx
const [breaks, setBreaks] = useState<readonly number[]>([]);
const layout = useJuliya({
  text,
  forcedBreaks: breaks,
  onForcedBreaksChange: setBreaks,
});
```

## Next.js App Router

`JuliyaText`와 `JuliyaProvider`는 공개 진입점에 Client Component 경계가 설정되어 있으므로 일반적인 Server Component에서 가져와 사용할 수 있습니다. 훅을 직접 사용하는 컴포넌트는 `use client` 선언이 필요합니다.

```tsx
import { JuliyaProvider, JuliyaText } from '@oddmash/juliya/react';
import { JuliyaSentenceText } from '@oddmash/juliya/react/server';

const Page = () => (
  <main>
    <JuliyaProvider locale="ko">
      <JuliyaText as="h1">한국어 제목입니다.</JuliyaText>
    </JuliyaProvider>
    <JuliyaSentenceText as="p">첫 문장입니다. 다음 문장입니다.</JuliyaSentenceText>
  </main>
);

export default Page;
```

`JuliyaSentenceText`는 브라우저 API나 React 훅을 필요로 하지 않습니다. 서버 전용 진입점은 클라이언트 Provider의 언어를 읽지 않으므로 한국어 이외의 언어는 `locale`을 명시하세요. 자세한 동작은 [SSR 문서](ssr.md)를 확인하세요.

## 기존 API에서 이전하기

### WrapText

`WrapText`와 `JuliyaText`는 동일한 컴포넌트입니다. 기존 코드를 수정하지 않아도 되고, 새 이름으로 변경하더라도 기존 prop과 렌더링 방식은 그대로입니다.

### useKowrap 사용법

`useKowrap`과 `useJuliya`는 동일한 훅입니다. 기존 옵션과 반환값을 유지합니다. `SentenceText`도 `JuliyaSentenceText`와 동일한 서버 전용 컴포넌트입니다.

```tsx
import { WrapText, useKowrap } from '@oddmash/juliya/react';
```

기존 API 이름은 Juliya에서도 사용할 수 있습니다. 새 API에서는 Provider가 있는 경우 그 언어를 공유하고, Provider가 없는 기존 사용 환경에서는 종전처럼 한국어가 기본값입니다.

레거시 Kowrap과 Juliya를 동시에 설치하면 각 패키지가 별도의 React 컨텍스트를 생성합니다. `JuliyaProvider`와 해당 Provider의 하위 컴포넌트 및 훅은 반드시 같은 패키지명에서 가져오세요.
