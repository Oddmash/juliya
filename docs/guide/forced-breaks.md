# 의도적인 개행

자동 줄바꿈만으로는 디자인에서 의도한 문장 구분을 보존하기 어려울 수 있습니다. kowrap은 명시적 개행뿐 아니라 원문을 수정하지 않는 강제 줄바꿈 경계를 지원합니다.

## 원문에 개행이 있는 경우

```tsx
<JuliyaText as="h1">
  {'첫 번째 제목\n두 번째 제목'}
</JuliyaText>
```

원문의 개행은 모든 환경에서 그대로 존중합니다. CRLF, LF 등의 명시적 개행은 결과의 `breakAfter`에 저장됩니다.

## forcedBreaks

텍스트 자체를 변경하지 않고 특정 위치를 강제하려면 `forcedBreaks` 배열을 사용합니다.

```ts
import { wrap } from '@oddmash/kowrap';

const text = '자연스러운 한국어 줄바꿈을 경험하세요';
const forcedBreaks = [text.indexOf('줄바꿈')];

const lines = wrap(text, {
  width: 14,
  measure: (value) => [...value].length,
  forcedBreaks,
});
```

폭이 충분한 화면에서도 해당 위치에서는 반드시 줄이 바뀝니다. 각 구간이 너무 길면 그 안에서 자동 줄바꿈을 추가합니다. 배열 순서는 자동으로 정렬되고 중복 위치는 하나로 합쳐집니다.

## 유효한 위치

위치는 JavaScript 문자열의 UTF-16 인덱스입니다. 문자열 내부의 grapheme 경계만 허용되며, 0, 문자열 끝, 문자 결합 내부를 지정하면 `RangeError`가 발생합니다.

```ts
const text = '가👩‍💻나';
const valid = [text.indexOf('나')];
```

문자 수로 직접 계산하기보다 `indexOf` 또는 선택 영역의 `selectionStart`를 사용하는 것이 편리합니다. 입력 텍스트가 수정되면 기존 위치도 다시 계산하세요.

## SSR 초기 개행

`splitLines(text, forcedBreaks)`는 폭을 측정하지 않고 명시적 개행과 강제 경계만 구분합니다. 결과 형식은 `WrappedLine[]`이고 `width`는 모두 0입니다.

```ts
import { splitLines } from '@oddmash/kowrap';

const text = '읽기 좋은 한국어 문장';
const initial = splitLines(text, [text.indexOf('한국어')]);
```

서버와 클라이언트의 첫 렌더링에 같은 결과를 사용하면 강제 개행을 미리 표시하면서 하이드레이션 불일치를 피할 수 있습니다.

## React에서 동적으로 제어

```tsx
'use client';

import { useJuliya } from '@oddmash/kowrap/react';

const { ref, lines, forcedBreaks, setForcedBreaks, clearForcedBreaks } = useJuliya({
  text,
  initialForcedBreaks: [text.indexOf('줄바꿈')],
});
```

`setForcedBreaks`로 위치 배열을 바꾸고 `clearForcedBreaks`로 자동 개행만 남길 수 있습니다. 컴포넌트에서 직접 렌더링하려면 [React 훅 사용법](react.md)을 참고하세요.
