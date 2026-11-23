# kowrap

한국어를 읽는 흐름에 맞춰 자연스럽게 줄바꿈하는 라이브러리입니다.

실제 글자 폭과 한국어 어절 및 문장 경계를 고려하여 제목과 문장의 줄바꿈을 최적화합니다.

[체험하기](https://oddmash.github.io/kowrap/#playground) | [문서](https://oddmash.github.io/kowrap/docs/) | [npm](https://www.npmjs.com/package/@oddmash/kowrap)

[![Kowrap 공개 랜딩에서 줄바꿈을 비교하고 문장을 편집하는 화면](docs/assets/kowrap-live.jpg)](https://oddmash.github.io/kowrap/#playground)

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
