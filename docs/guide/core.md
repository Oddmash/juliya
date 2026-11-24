# 코어 엔진

`wrap`은 원문 문자열, 최대 폭, 호출자가 제공한 측정 함수를 받아 줄 데이터를 반환합니다. 결과를 화면에 그리거나 파일로 저장하는 일은 호출자가 담당합니다. 브라우저에서 요소의 폭과 글꼴을 자동으로 측정하고 화면에 적용하려면 [HTML과 DOM](dom.md)의 `mountKowrap`을 사용하세요.

## wrap

```ts
import { wrap } from '@oddmash/kowrap';

const lines = wrap('한글 어절을 자연스럽게 줄바꿈합니다.', {
  width: 12,
  measure: (text) => [...text].length,
  strategy: 'balanced',
  breakLongWords: true,
});
```

**필수 입력:** 원문 `text`와 `width`, `measure`가 필요합니다.

| 옵션 | 필수 여부 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `width` | 필수 | number | 없음 | 양수의 최대 줄 폭 |
| `measure` | 필수 | Measure | 없음 | 문자열을 받아 같은 단위의 폭을 반환하는 함수 |
| `measureRange` | 선택 | (start: number, end: number) => number | 없음 | 원문 범위의 폭을 직접 측정하는 함수 |
| `strategy` | 선택 | WrapOptions["strategy"] | `balanced` | 균형 최적화 또는 `greedy` 순차 탐색 |
| `breakLongWords` | 선택 | boolean | `true` | 긴 어절의 grapheme 분리 |
| `forcedBreaks` | 선택 | readonly number[] | 없음 | 반드시 줄을 나눌 원문 UTF-16 위치 |

`width`는 유한한 양수여야 합니다. `measure`는 유한하고 음수가 아닌 수를 반환해야 합니다. 유효하지 않은 값은 `RangeError`를 발생시킵니다. 같은 입력을 같은 단위로 일관되게 측정해야 합니다.

### 폭과 측정 함수의 단위

위 예제의 `width: 12`는 픽셀이 아니라 유니코드 코드 포인트 12개를 뜻합니다. 브라우저에서 `width`를 픽셀로 전달한다면 `measure`도 동일한 글꼴, 글자 크기와 간격에서 픽셀 폭을 반환해야 합니다. 화면 요소가 이미 있다면 [DOM 측정과 HTML](dom.md)의 어댑터가 그 설정을 읽습니다.

실제 화면 폭을 기준으로 코어 엔진을 직접 사용하려면 다음처럼 캔버스 측정 함수를 전달할 수 있습니다. 브라우저에서 실행하는 예제입니다.

```ts
import { wrap } from '@oddmash/kowrap';
import { createCanvasMeasure } from '@oddmash/kowrap/dom';

await document.fonts.ready;
const measure = createCanvasMeasure({ font: '400 24px sans-serif' });
const lines = wrap('팀의 모든 문서를 한곳에서 관리하세요', {
  width: 280,
  measure,
});
console.log(lines.map(line => line.text));
```

`wrap`의 결과를 렌더링할 때는 각 줄의 `text`를 쓰고, 원문 복원에는 `breakAfter`도 이어 붙이세요. 줄 끝의 공백은 시각적 폭에서 제외돼도 `text`에는 남아 있을 수 있습니다.

## 전략 선택

**balanced**는 가능한 줄 수를 우선 최소화한 뒤 남는 여백, 문장 끝, 쉼표, 한국어 수식 관계 등에 비용을 적용합니다. 제목과 짧은 설명처럼 전체 줄 균형이 중요할 때 권장합니다.

**greedy**는 현재 줄에서 들어갈 수 있는 가장 긴 경계를 선택하고 앞으로 진행합니다. 더 단순한 순차 처리나 긴 입력에서 더 적은 측정 호출이 필요할 때 사용할 수 있습니다.

```ts
const balanced = wrap(text, { width, measure, strategy: 'balanced' });
const greedy = wrap(text, { width, measure, strategy: 'greedy' });
```

## 반환값

`WrappedLine[]`의 각 항목에는 다음 필드가 있습니다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `text` | string | 원문의 해당 줄 부분 문자열 |
| `start` | number | 원문 UTF-16 시작 위치 |
| `end` | number | 원문 UTF-16 끝 위치 (exclusive) |
| `width` | number | 측정된 폭, 줄 끝 일반 공백 제외 |
| `breakAfter` | string | 원문에 포함된 명시적 개행 문자 |

소프트 줄바꿈은 원문에 개행을 추가하지 않습니다. `breakAfter`는 원문에 실제로 존재한 개행만 보존합니다.

```ts
const restored = lines.map((line) => line.text + line.breakAfter).join('');
console.log(restored === text);
```

## 빈 문자열과 긴 어절

빈 문자열은 폭이 0인 빈 줄 하나를 반환합니다. `breakLongWords: false`이면 들어가지 않는 긴 어절이 폭을 초과할 수 있습니다. grapheme 하나 자체가 폭보다 넓은 경우에도 초과가 불가피합니다.

```ts
wrap('아주긴공백없는문자열', {
  width: 4,
  measure: (text) => Array.from(text).length,
  breakLongWords: false,
});
```

## 문장 분리

`segmentSentences(text, locale?)`는 `Intl.Segmenter`로 문장을 분리합니다. 기본 locale은 `ko`이고, 각 조각은 `text`, `start`, `end`를 반환합니다. 문장 끝의 원문 공백과 부호를 버리지 않습니다.

```ts
import { segmentSentences } from '@oddmash/kowrap';

const segments = segmentSentences('첫 문장입니다. 다음 문장입니다!');
```

폭 측정이 필요 없는 강제 개행은 [splitLines](forced-breaks.md)를 사용합니다.

## 제한 사항

코어의 한국어 수식 관계는 간단한 휴리스틱이며 형태소 분석기가 아닙니다. 모든 문장의 의미를 완벽히 판별하지 않습니다. 측정 함수의 폭이 문자열 길이에 따라 대체로 증가한다는 전제가 있으므로 복잡한 사용자 정의 측정에는 주의가 필요합니다.
