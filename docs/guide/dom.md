# 일반 HTML과 DOM

HTML 요소의 줄바꿈을 화면에 적용할 때는 `mountKowrap`을 사용합니다. DOM 어댑터가 요소의 폭과 글꼴을 측정하고, 코어 엔진으로 줄을 계산해 화면에 적용합니다. 요소 크기가 바뀌면 다시 계산합니다. 폭을 직접 측정하고 줄 데이터만 받으려면 [코어 엔진](core.md)을 사용하세요.

## 번들러 없는 정적 HTML

아래 코드를 `index.html`로 저장하고 인터넷에 연결된 브라우저에서 열어보세요. jsDelivr가 Kowrap 0.3.0을 제공하므로 npm 설치나 파일 복사가 필요 없습니다.

```html
<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<title>Kowrap 예제</title>
<p id="title" style="max-width: 220px; font-size: 24px">팀의 모든 문서를 한곳에서 관리하세요</p>
<script type="module">
  import { mountKowrap } from 'https://cdn.jsdelivr.net/npm/@oddmash/kowrap@0.3.0/dist/dom/index.js/+esm';

  const title = document.getElementById('title');
  mountKowrap(title, { text: title.textContent });
</script>
</html>
```

`<script type="module">` 안에서 브라우저가 CDN 모듈을 불러옵니다. 직접 호스팅하려면 패키지의 `dist` 폴더 전체를 웹 서버에 올리고, `import`에 해당 서버의 `dist/dom/index.js` URL을 써도 됩니다.

## npm과 빌드 도구를 사용하는 경우

Vite 같은 빌드 도구를 사용한다면 패키지 이름으로 가져올 수 있습니다.

```html
<p id="title">자연스러운 한국어 줄바꿈을 경험하세요.</p>
```

```ts
import { mountKowrap } from '@oddmash/kowrap/dom';

const element = document.querySelector<HTMLElement>('#title');
if (!element) throw new Error('Title not found');

const controller = mountKowrap(element, {
  text: element.textContent ?? '',
});
```

문자열 모드는 요소의 자식 DOM을 관리합니다. 기존 인라인 요소를 유지하려면 `inline: true`를 사용합니다. 요소에는 측정 가능한 블록 폭이 있어야 합니다.

## 인라인 마크업

```html
<p id="rich">읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과 <a href="/docs">문서</a>를 만나보세요.</p>
```

```ts
const controller = mountKowrap(document.getElementById('rich')!, { inline: true });
```

`strong`, `em`, `span`, `a` 등 텍스트를 포함하는 중첩 인라인 요소의 실제 계산된 글꼴로 폭을 측정합니다. 기존 요소, 속성, 이벤트는 유지하고 필요한 위치에만 개행을 삽입합니다. `destroy()`로 추가한 개행을 제거합니다.

## 업데이트와 해제

```ts
controller.update({
  text: '새로운 한국어 문장입니다.',
  strategy: 'balanced',
  forcedBreaks: [4],
});

controller.refresh();
controller.destroy();
```

| 메서드 | 역할 |
| --- | --- |
| `update(options)` | 새 텍스트와 전략, 강제 경계 적용 |
| `refresh()` | 현재 요소 크기와 글꼴 다시 측정 |
| `destroy()` | 관찰자 해제, 원문 텍스트와 초기 인라인 스타일 복원 |

`update`는 전체 옵션을 받으므로 기존 값을 유지하려면 함께 전달합니다. 더 이상 요소를 사용하지 않을 때 `destroy()`를 호출하세요.

### 폭과 텍스트가 바뀔 때

창이 좁아지거나 부모 그리드의 열 너비가 달라지면 요소의 콘텐츠 폭을 다시 측정합니다. 문자열 모드에서 문장을 수정할 때는 `textContent`를 직접 덮어쓰기보다 `controller.update({ text: nextText })`로 새 원문을 전달하세요. 인라인 모드에서 링크나 강조 내용을 바꾸는 경우에는 실제 마크업을 갱신하면 어댑터가 변화를 관찰합니다.

탭이나 접힌 패널 안에 있는 요소는 폭이 0일 수 있습니다. 패널을 펼친 뒤에도 결과가 갱신되지 않는다면 요소가 화면에 배치된 시점에 `controller.refresh()`를 호출하세요.

## DOM을 직접 관리하지 않는 관찰 API

Angular, Solid 또는 자체 렌더러에서는 `observeKowrap`으로 줄 데이터만 받을 수 있습니다. 이 함수는 요소의 자식을 수정하지 않습니다.

```ts
import { observeKowrap } from '@oddmash/kowrap/dom';

const controller = observeKowrap(element, { text }, ({ lines, measured }) => {
  renderMyLines(lines);
  console.log(measured);
});
```

`measured`가 false이면 아직 화면 폭이 없거나 측정할 수 없습니다. 이때 명시적 개행과 강제 경계에 해당하는 초기 결과가 전달됩니다. 렌더링은 프레임워크 또는 호출자가 담당합니다.

## Canvas 측정

```ts
import { wrap } from '@oddmash/kowrap';
import { createCanvasMeasure } from '@oddmash/kowrap/dom';

const measure = createCanvasMeasure({
  font: '400 18px sans-serif',
  letterSpacing: '0px',
  wordSpacing: '0px',
});

const lines = wrap('한글과 English를 함께 사용합니다.', { width: 240, measure });
```

글꼴 문자열은 실제 Canvas의 font 속성으로 전달됩니다. 옵션은 `font`, `letterSpacing`, `wordSpacing`, `fontKerning`입니다. 문자 간격과 단어 간격은 해당 Canvas 속성을 지원하는 브라우저에서만 반영됩니다.
