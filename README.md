# 줄이야 (Juliya)

한국어, 영어, 일본어, 중국어 간체의 줄바꿈 경계와 실제 화면 폭을 함께 고려하는 라이브러리입니다. 기존 Kowrap의 공개 API와 한국어 기본 동작을 유지합니다.

한국어 어절, 영어 수식 관계, 일본어·중국어의 연속 텍스트와 문장부호를 고려합니다. 언어별 규칙은 휴리스틱이며 모든 문장의 의미를 완벽하게 분석한다는 보장은 없습니다.

[체험하기](https://oddmash.github.io/kowrap/#playground) | [문서](https://oddmash.github.io/kowrap/docs/) | [npm](https://www.npmjs.com/package/@oddmash/kowrap)

랜딩에서는 같은 글꼴과 폭에서 실제 줄바꿈 위치의 변화를 시연합니다. 한국어, 영어, 일본어, 중국어 예제를 제공하며 시연을 일시 정지할 수 있습니다.

## 언어 선택

신규 언어 진입점이 포함된 버전에서는 하나의 패키지에서 원하는 언어를 선택합니다.

```ts
import { wrap } from '@oddmash/kowrap/ja';

const lines = wrap('読みやすい文章を、もっと自然に。', {
  width: 10,
  measure: text => [...text].length,
});
```

지원 경로는 `/ko`, `/en`, `/ja`, `/zh`입니다. 기존 루트의 `wrap(text, { width, measure })`는 한국어를 유지하며, `locale` 옵션으로 명시적으로 변경할 수 있습니다. React, DOM, Vue, Svelte의 기존 진입점은 유지합니다.

새 브랜드 패키지 `@oddmash/juliya`는 동일한 구현과 언어별 진입점으로 발행할 예정입니다. 기존 패키지는 삭제하거나 덮어쓰지 않습니다.

## HTML에서 바로 실행하기

아래 코드를 `index.html`로 저장하고 인터넷에 연결된 브라우저에서 열면 jsDelivr가 Kowrap `0.3.0`을 불러옵니다.

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

## 특징

- 한국어 어절을 보존하는 균형 잡힌 줄바꿈
- 화면 폭 변화에 따른 자동 재계산
- 의도적인 개행 위치 지정
- 강조, 링크 등 인라인 마크업 유지
- React, Next.js, Vue, Svelte 및 일반 HTML 지원

## 지원 범위

kowrap은 제목과 짧은 문장에 적합합니다. 강조와 링크를 포함한 중첩 인라인 텍스트도 지원합니다.

[기여 안내](CONTRIBUTING.md)
