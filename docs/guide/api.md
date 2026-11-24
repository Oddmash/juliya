# API 레퍼런스

kowrap은 필요한 환경의 진입점만 불러올 수 있도록 분리되어 있습니다. 아래는 공개 API를 한곳에서 확인할 수 있는 참조 목록입니다.

## 코어

```ts
import { wrap, splitLines, segmentSentences } from '@oddmash/kowrap';
import type { Measure, WrapOptions, WrappedLine, TextSegment } from '@oddmash/kowrap';
```

화면 폭에 맞춰 줄을 계산하려면 `wrap`, 원문의 개행과 지정한 위치만 반영하려면 `splitLines`, 문장 단위가 필요하면 `segmentSentences`를 사용합니다. `wrap`을 선택했을 때만 폭과 측정 함수를 제공해야 합니다.

| API | 필수 입력 | 선택 입력 | 출력 |
| --- | --- | --- | --- |
| `wrap` | `text`, `options.width`, `options.measure` | 전략, 강제 경계 등 | WrappedLine 배열 |
| `splitLines` | `text` | `forcedBreaks` | WrappedLine 배열 |
| `segmentSentences` | `text` | `locale` | TextSegment 배열 |

[코어 옵션의 필수 여부와 기본값](core.md#wrap)을 확인하세요.

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
import type { CanvasMeasureOptions, KowrapOptions, MountKowrapOptions, KowrapController, KowrapLayout } from '@oddmash/kowrap/dom';
```

| API | 필수 입력 | 선택 입력 | 출력 |
| --- | --- | --- | --- |
| `createCanvasMeasure(options, ownerDocument?)` | `options.font` | `ownerDocument`, 간격 및 커닝 | Measure 함수 |
| `observeKowrap(element, options, onLayout)` | `element`, `options.text`, `onLayout` | 전략, 강제 경계 등 | KowrapController |
| `mountKowrap(element, options)` | `element`, `options.text` 또는 `options.inline: true` | 전략, 강제 경계 등 | KowrapController |

문자열 모드의 `text`는 필수이며 인라인 모드에서는 `inline: true`를 전달하고 `text`를 전달하지 않습니다. `KowrapLayout`에는 `lines`, `measured`가 포함됩니다. [DOM 옵션 표](dom.md#옵션)를 확인하세요.

### mountKowrap과 observeKowrap

`mountKowrap`은 계산한 줄바꿈을 요소에 반영합니다. 기존 링크나 강조 마크업을 유지하려면 `{ inline: true }`로 마운트하세요. 문자열 모드와 인라인 모드는 마운트 시 결정합니다.

`observeKowrap`은 자식 요소를 수정하지 않고 콜백으로 줄 데이터를 전달합니다. `measured`가 `false`이면 아직 요소의 실측 폭이 확보되지 않은 초기 결과입니다. 어느 방식을 사용하든 요소를 제거할 때 반환된 컨트롤러의 `destroy()`를 호출하세요.

```ts
interface KowrapController {
  update: (options: MountKowrapOptions) => void;
  refresh: () => void;
  destroy: () => void;
}
```

## React

| API | 경로 | 필수 입력 | 선택 입력 | 역할 |
| --- | --- | --- | --- | --- |
| `WrapText` | `/react` | `children` | `as`, 전략, 강제 경계, 스타일 등 | 측정 및 렌더링 |
| `useKowrap` | `/react` | `text` | 전략, 강제 경계, 콜백 등 | 직접 렌더링과 상태 제어 |
| `SentenceText` | `/react/server` | `children` (string) | `as`, `locale`, `forcedBreaks` | 문장 단위 CSS 렌더링 |

`WrapTextProps`, `UseKowrapOptions`, `SentenceTextProps` 타입을 각각 해당 진입점에서 가져올 수 있습니다. [React 옵션 표](react.md#wraptext)를 확인하세요.

`useKowrap`는 `ref`, `lines`, `measured`, `forcedBreaks`, `setForcedBreaks`, `clearForcedBreaks`를 반환합니다.

## Vue와 Svelte

```ts
import { kowrapDirective } from '@oddmash/kowrap/vue';
import { kowrap } from '@oddmash/kowrap/svelte';
```

두 어댑터 모두 `MountKowrapOptions`를 받아 공통 DOM 컨트롤러와 연결합니다. Vue에서는 디렉티브 생명주기, Svelte에서는 액션의 update와 destroy를 사용합니다.
