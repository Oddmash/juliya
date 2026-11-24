# SSR과 하이드레이션

서버는 방문자의 실제 화면 폭과 사용 가능한 글꼴을 알 수 없습니다. 줄이야는 서버에서도 의미 있는 원문을 렌더링하고, 브라우저 측정이 가능해진 뒤 자동 줄바꿈을 적용합니다. 새 패키지 `@oddmash/juliya`는 발행 예정이며, 아래 API는 신규 버전의 `@oddmash/kowrap`에서도 제공됩니다.

## React와 Next.js

`JuliyaText`의 초기 SSR과 첫 클라이언트 렌더링은 동일한 데이터를 사용합니다. 클라이언트 효과가 시작되면 DOM 폭을 재고 줄바꿈을 다시 계산합니다. 초기 CSS 줄바꿈과 최종 줄 위치가 달라질 수 있습니다.

```tsx
import { JuliyaText } from '@oddmash/juliya/react';

<JuliyaText as="h1" style={{ maxWidth: 400 }}>
  서버에서도 원문을 먼저 보여줍니다.
</JuliyaText>
```

## Server Component 전용 API

`JuliyaSentenceText`는 브라우저 측정 대신 문장 단위 CSS 줄바꿈을 사용합니다. 클라이언트 훅이나 Canvas가 필요하지 않습니다. 기존 `SentenceText`는 동일한 컴포넌트의 별칭입니다.

```tsx
import { JuliyaSentenceText } from '@oddmash/juliya/react/server';

<JuliyaSentenceText as="p">
  첫 번째 문장입니다. 두 번째 문장입니다.
</JuliyaSentenceText>
```

문장 구간은 CSS inline-block으로 묶이므로 문장 사이가 우선 줄 경계가 됩니다. 문장이 한 줄보다 길면 그 안에서 자연스러운 CSS 줄바꿈이 가능하도록 합니다. 다음 옵션을 사용할 수 있습니다.

| prop | 필수 여부 | 기본값 | 역할 |
| --- | --- | --- | --- |
| `children` | 필수 | 없음 | 문자열 원문 |
| `as` | 선택 | `span` | 렌더링 태그 |
| `locale` | 선택 | `ko` | 문장 분리 언어 |
| `forcedBreaks` | 선택 | 없음 | 강제 경계 |

서버 전용 진입점은 클라이언트 `JuliyaProvider` 컨텍스트를 사용하지 않습니다. 서버의 라우팅 및 i18n 설정에서 구한 언어를 `locale`에 직접 전달하세요. Provider를 사용한 초기 SSR에서는 서버와 클라이언트에 같은 언어를 전달해야 합니다.

## 강제 개행과 초기 화면

```tsx
<JuliyaText as="h1" forcedBreaks={[5]}>
  한국어를 읽는 흐름대로.
</JuliyaText>
```

강제 개행은 화면 폭과 무관하게 결정할 수 있으므로 서버 초기 화면에도 적용됩니다. 원문과 인덱스를 서버 및 클라이언트에서 동일하게 전달해야 합니다.

## 프레임워크 독립 SSR

Vue, Svelte 등의 서버 렌더링에서 자식 DOM을 직접 관리하려면 다음 흐름을 사용합니다.

1. 서버에서 `splitLines(text, forcedBreaks)`로 초기 줄 데이터 생성
2. 템플릿에서 각 `text`와 `breakAfter`를 렌더링하고 소프트 줄 경계에는 br 요소 사용
3. 클라이언트가 마운트된 뒤 같은 요소에 `observeKowrap` 연결
4. 관찰 결과를 상태에 반영하고 프레임워크가 줄 DOM을 업데이트
5. 요소 제거 시 반환된 컨트롤러의 `destroy()` 호출

`splitLines`는 폭이 모두 0인 초기 줄을 반환하므로 폭을 기반으로 한 화면 측정은 아직 되지 않은 상태입니다.

## 주의할 점

- 서버에서 브라우저 API를 직접 호출하지 않습니다.
- 하이드레이션 전에 클라이언트 측정 결과를 강제로 렌더링하지 않습니다.
- 폰트가 늦게 로딩될 때 줄 위치가 바뀔 수 있습니다.
- 서버에서 정확한 브라우저 최종 픽셀 폭을 보장하는 기능은 현재 제공하지 않습니다.
