# Juliya（줄이야）

[English](https://github.com/Oddmash/juliya#readme) · [한국어](https://github.com/Oddmash/juliya/blob/main/docs/readme/ko.md) · [日本語](https://github.com/Oddmash/juliya/blob/main/docs/readme/ja.md) · [简体中文](https://github.com/Oddmash/juliya/blob/main/docs/readme/zh.md)

Juliya 是面向韩语、英语、日语和简体中文的文本换行库，适用于标题和短段落。它结合语言特定的换行边界与实际字体和容器宽度，帮助文本在自然的位置换行。

[演示](https://oddmash.github.io/juliya/zh/#playground) | [文档](https://oddmash.github.io/juliya/zh/docs/) | [npm](https://www.npmjs.com/package/@oddmash/juliya)

## 选择语言

支持 `@oddmash/juliya/ko`、`/en`、`/ja`、`/zh`。根入口的 `wrap` 在未指定 locale 时默认使用韩语规则。

```ts
import { wrap } from '@oddmash/juliya/zh';

const lines = wrap('让每一行自然易读。', {
  width: 10,
  measure: (text) => [...text].length,
});
```

此示例使用字符数作为宽度。DOM 和框架适配器会测量实际字体及容器宽度。

## React / Next.js

```tsx
import { JuliyaProvider, JuliyaText } from '@oddmash/juliya/react';

<JuliyaProvider locale="zh-Hans">
  <JuliyaText as="h1">让每一行自然易读。</JuliyaText>
</JuliyaProvider>
```

## 特性

- 按语言选择换行规则，并平衡各行宽度。
- 容器宽度或字体变化时自动重新计算。
- 保留显式换行和嵌套的内联标记。
- 支持 React、Next.js、Vue、Svelte 和普通 HTML。

语言规则基于启发式方法，并非完整的自然语言语义分析，适用于标题和短段落。

## 从 Kowrap 迁移

`@oddmash/kowrap@0.4.0` 是旧包的最后一个版本。后续更新只通过 `@oddmash/juliya` 发布。旧版本仍可安装；更换包名即可继续使用相同的公开 API 和子路径。

[HTML 和 DOM](https://oddmash.github.io/juliya/zh/docs/dom/) | [使用指南](https://oddmash.github.io/juliya/zh/docs/) | [MIT License](../../LICENSE)
