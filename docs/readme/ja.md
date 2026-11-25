# Juliya（ 줄이야 ）

[English](https://github.com/Oddmash/juliya#readme) · [한국어](https://github.com/Oddmash/juliya/blob/main/docs/readme/ko.md) · [日本語](https://github.com/Oddmash/juliya/blob/main/docs/readme/ja.md) · [简体中文](https://github.com/Oddmash/juliya/blob/main/docs/readme/zh.md)

Juliya は韓国語、英語、日本語、中国語（簡体字）の見出しや短い文章を、読みやすい位置で改行するライブラリです。言語ごとの改行境界を考慮し、実際の文字幅とコンテナ幅に合わせて行を調整します。

[デモ](https://oddmash.github.io/juliya/ja/#playground) | [ドキュメント](https://oddmash.github.io/juliya/ja/docs/) | [npm](https://www.npmjs.com/package/@oddmash/juliya)

## 言語の選択

`@oddmash/juliya/ko`、`/en`、`/ja`、`/zh` が利用できます。ルートの `wrap` は locale を省略すると韓国語が既定になります。

```ts
import { wrap } from '@oddmash/juliya/ja';

const lines = wrap('文章を自然に読みやすく。', {
  width: 10,
  measure: (text) => [...text].length,
});
```

上記は文字数を使った簡単な例です。DOM とフレームワークのアダプターは実際の文字幅を測定します。

## React / Next.js

```tsx
import { JuliyaProvider, JuliyaText } from '@oddmash/juliya/react';

<JuliyaProvider locale="ja">
  <JuliyaText as="h1">文章を自然に読みやすく。</JuliyaText>
</JuliyaProvider>
```

## 特徴

- 言語ごとの改行規則と行幅のバランス。
- コンテナ幅やフォントの変化に応じた再計算。
- 明示的な改行と入れ子のインラインマークアップの保持。
- React、Next.js、Vue、Svelte、通常の HTML に対応。

言語規則はヒューリスティックです。自然言語の意味を完全に解析するものではなく、見出しや短い文章に適しています。

## Kowrap からの移行

`@oddmash/kowrap@0.4.0` は旧パッケージの最終版です。今後の更新は `@oddmash/juliya` のみで提供します。既存バージョンは引き続き利用できます。パッケージ名を変更しても公開 API とサブパスは維持されます。

[HTML と DOM](https://oddmash.github.io/juliya/ja/docs/dom/) | [利用ガイド](https://oddmash.github.io/juliya/ja/docs/) | [MIT License](../../LICENSE)
