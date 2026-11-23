# API 레퍼런스

kowrap은 필요한 환경의 진입점만 불러올 수 있도록 분리되어 있습니다. 아래는 공개 API를 한곳에서 확인할 수 있는 참조 목록입니다.

## 코어

```ts
import { wrap, splitLines, segmentSentences } from '@oddmash/kowrap';
import type { Measure, WrapOptions, WrappedLine, TextSegment } from '@oddmash/kowrap';
```

| API | 입력 | 출력 |
| --- | --- | --- |
| `wrap` | text, WrapOptions | WrappedLine 배열 |
| `splitLines` | text, forcedBreaks (선택) | WrappedLine 배열 |
| `segmentSentences` | text, locale (선택) | TextSegment 배열 |

```ts
type Measure = (text: string) => number;
interface WrappedLine {
  text: string;
  start: number;
  end: number;
  width: number;
  breakAfter: string;
}
```

## DOM

설치 없이 브라우저에서 시작하려면 [정적 HTML CDN 예제](dom.md)를 사용하세요.

```ts
import { createCanvasMeasure, observeKowrap, mountKowrap } from '@oddmash/kowrap/dom';
import type { CanvasMeasureOptions, KowrapOptions, KowrapController, KowrapLayout } from '@oddmash/kowrap/dom';
```

| API | 출력 |
| --- | --- |
| `createCanvasMeasure(options, ownerDocument?)` | Measure 함수 |
| `observeKowrap(element, options, onLayout)` | KowrapController |
| `mountKowrap(element, options)` | KowrapController |

`KowrapOptions`에는 필수 `text`와 선택적 `strategy`, `breakLongWords`, `forcedBreaks`가 포함됩니다. `KowrapLayout`에는 `lines`, `measured`가 포함됩니다.

```ts
interface KowrapController {
  update: (options: KowrapOptions) => void;
  refresh: () => void;
  destroy: () => void;
}
```

## React

| API | 경로 | 용도 |
| --- | --- | --- |
| `WrapText` | `/react` | 측정과 렌더링을 함께 처리 |
| `useKowrap` | `/react` | 직접 렌더링과 강제 경계 상태 제어 |
| `SentenceText` | `/react/server` | 측정 없는 문장 단위 CSS 렌더링 |

`WrapTextProps`, `UseKowrapOptions`, `SentenceTextProps` 타입을 각각 해당 진입점에서 가져올 수 있습니다.

`useKowrap`는 `ref`, `lines`, `measured`, `forcedBreaks`, `setForcedBreaks`, `clearForcedBreaks`를 반환합니다.

## Vue와 Svelte

```ts
import { kowrapDirective } from '@oddmash/kowrap/vue';
import { kowrap } from '@oddmash/kowrap/svelte';
```

두 어댑터 모두 `KowrapOptions`를 받아 공통 DOM 컨트롤러와 연결합니다. Vue에서는 디렉티브 생명주기, Svelte에서는 액션의 update와 destroy를 사용합니다.
