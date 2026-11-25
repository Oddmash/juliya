# 줄이야 (Juliya)

[English](https://github.com/Oddmash/juliya#readme) · [한국어](https://github.com/Oddmash/juliya/blob/main/docs/readme/ko.md) · [日本語](https://github.com/Oddmash/juliya/blob/main/docs/readme/ja.md) · [简体中文](https://github.com/Oddmash/juliya/blob/main/docs/readme/zh.md)

한국어, 영어, 일본어, 중국어 간체의 줄바꿈 경계와 실제 화면 폭을 함께 고려하는 라이브러리입니다. 기존 Kowrap의 공개 API와 한국어 기본 동작을 유지합니다.

한국어 어절, 영어 수식 관계, 일본어·중국어의 연속 텍스트와 문장부호를 고려합니다. 언어별 규칙은 휴리스틱이며 모든 문장의 의미를 완벽하게 분석한다는 보장은 없습니다.

[체험하기](https://oddmash.github.io/juliya/#playground) | [문서](https://oddmash.github.io/juliya/docs/) | [npm](https://www.npmjs.com/package/@oddmash/juliya)

랜딩에서는 선택한 언어의 다양한 예제를 표시하고 폭에 따라 실제 줄바꿈 위치가 변화하는 모습을 시연합니다.

## 언어 선택

하나의 패키지에서 한국어, 영어, 일본어, 중국어 간체를 선택할 수 있습니다.

```ts
import { wrap } from '@oddmash/juliya/ja';

const lines = wrap('読みやすい文章を、もっと自然に。', {
  width: 10,
  measure: text => [...text].length,
});
```

지원 경로는 `/ko`, `/en`, `/ja`, `/zh`입니다. 기존 루트의 `wrap(text, { width, measure })`는 한국어를 유지하며, `locale` 옵션으로 명시적으로 변경할 수 있습니다. React, DOM, Vue, Svelte의 기존 진입점은 유지합니다.

**Kowrap에서 이전하는 경우:** `@oddmash/kowrap@0.4.0`은 마지막 릴리스입니다. 이후 업데이트는 `@oddmash/juliya`에서만 제공하며, 기존 Kowrap 버전은 계속 설치할 수 있습니다. 패키지 이름을 바꾸면 같은 공개 API를 사용할 수 있습니다.

## React에서 언어 선택

`JuliyaProvider`로 애플리케이션 언어를 한 번 설정하면 그 하위의 `JuliyaText`와 `useJuliya`가 언어를 공유합니다.

```tsx
import { JuliyaProvider, JuliyaText } from '@oddmash/juliya/react';

<JuliyaProvider locale="ja">
  <JuliyaText as="h1">読みやすい文章を、もっと自然に。</JuliyaText>
  <JuliyaText as="p">画面の幅に合わせて改行します。</JuliyaText>
</JuliyaProvider>
```

개별 문장에 다른 언어를 적용하려면 `locale`을 직접 지정할 수 있습니다. Provider를 사용하지 않으면 기본 언어는 한국어입니다. 기존 `WrapText`, `useKowrap` 이름은 계속 사용할 수 있습니다.

두 패키지를 함께 사용하는 경우 Provider와 하위 컴포넌트는 동일한 패키지에서 가져오세요. [React 및 i18n 연동 예제](../guide/react.md)를 참고하세요.

## HTML에서 바로 실행하기

아래 코드를 `index.html`로 저장하고 인터넷에 연결된 브라우저에서 열면 jsDelivr가 Juliya `0.4.0`을 불러옵니다.

```html
<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<title>Juliya 예제</title>
<p id="title" style="max-width: 220px; font-size: 24px">팀의 모든 문서를 한곳에서 관리하세요</p>
<script type="module">
  import { mountKowrap } from 'https://cdn.jsdelivr.net/npm/@oddmash/juliya@0.4.0/dist/dom/index.js/+esm';

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

줄이야는 제목과 짧은 문장에 적합합니다. 강조와 링크를 포함한 중첩 인라인 텍스트도 지원합니다.

[기여 안내](../../CONTRIBUTING.md)
