# Juliya (줄이야)

[English](https://github.com/Oddmash/juliya#readme) · [한국어](https://github.com/Oddmash/juliya/blob/main/docs/readme/ko.md) · [日本語](https://github.com/Oddmash/juliya/blob/main/docs/readme/ja.md) · [简体中文](https://github.com/Oddmash/juliya/blob/main/docs/readme/zh.md)

Juliya is a locale-aware text wrapping library for readable headings and short passages in Korean, English, Japanese, and Simplified Chinese. It combines language-specific break boundaries with measured layout width instead of relying on character counts alone.

[Playground](https://oddmash.github.io/juliya/en/#playground) | [Documentation](https://oddmash.github.io/juliya/en/docs/) | [npm](https://www.npmjs.com/package/@oddmash/juliya)

## Choose a language

| Language | Entry point | Locale |
| --- | --- | --- |
| Korean | `@oddmash/juliya/ko` | `ko` |
| English | `@oddmash/juliya/en` | `en` |
| Japanese | `@oddmash/juliya/ja` | `ja` |
| Simplified Chinese | `@oddmash/juliya/zh` | `zh`, `zh-Hans` |

```ts
import { wrap } from '@oddmash/juliya/en';

const lines = wrap('Read every line naturally.', {
  width: 12,
  measure: (text) => [...text].length,
});
```

This example uses character counts for illustration. The DOM and framework adapters measure actual font and container width. The default root entry point uses Korean unless a locale is selected explicitly.

## React and Next.js

```tsx
import { JuliyaProvider, JuliyaText } from '@oddmash/juliya/react';

<JuliyaProvider locale="en">
  <JuliyaText as="h1">Read every line naturally.</JuliyaText>
  <JuliyaText as="p">Wrap text based on the available space.</JuliyaText>
</JuliyaProvider>
```

The provider shares its locale with child components and hooks. An explicit locale on a child takes precedence. See the [React guide](https://oddmash.github.io/juliya/en/docs/react/).

## Try in a browser

Save this Korean example as `index.html` and open it in a browser with an internet connection. The standalone example uses the verified Juliya 0.4.0 CDN entry point.

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

## Features

- Language-specific line breaking and balanced line widths.
- Automatic recalculation when the container or font changes.
- Explicit line breaks and nested inline markup preservation.
- React, Next.js, Vue, Svelte, and plain HTML support.
- Heuristic language rules, not comprehensive natural-language analysis. Best suited to headings and short passages.

## Migrating from Kowrap

`@oddmash/kowrap@0.4.0` is the final legacy release. All future updates and fixes are published exclusively as `@oddmash/juliya`. Existing versions remain available. Switch the package name while retaining the public API and subpath imports. Compatibility names such as `mountKowrap`, `WrapText`, and `useKowrap` remain available in Juliya.

[Migration and usage](https://oddmash.github.io/juliya/en/docs/) | [Contributing](CONTRIBUTING.md) | [MIT License](LICENSE)
