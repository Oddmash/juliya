import { engineLocale, landingCopy, languagePath } from "./locales";
import type { SiteLocale } from "./locales";

const descriptions = {
	en: [
		["Getting started", "Install the compatible package, select a language, and wrap text using actual layout measurements. Korean remains the default when locale is omitted."],
		["Core engine", "Pass a positive width and a non-negative measurement function in matching units. Balanced wrapping minimizes line count first, then considers remaining space and language boundaries; greedy selects the furthest fitting boundary."],
		["Forced breaks", "Offsets are UTF-16 positions at internal grapheme boundaries. Forced breaks do not alter the original text; explicit newlines remain in breakAfter."],
		["Inline markup", "Use inline mode for plain text elements with links or emphasis. Existing nested text markup is preserved."],
		["HTML and DOM", "Mount the adapter on an element to measure its font and container width. Call destroy when removing the element; update to change options."],
		["React and Next.js", "WrapText measures the actual element after hydration. useKowrap returns the layout data and forced-break controls for custom rendering."],
		["Vue", "Register the directive and pass a text and locale. For existing inline content, use inline: true instead."],
		["Svelte", "Use the action on an element. Reactive options update the measured wrapping; removing the element cleans up the controller."],
		["SSR and hydration", "The server cannot know the browser's actual font or width. SentenceText groups sentences without browser APIs; WrapText measures after hydration."],
		["API reference", "Core exports wrap, splitLines and segmentSentences. Browser and DOM paths are aliases. Existing React, Vue and Svelte exports remain compatible."],
		["Troubleshooting", "Check the selected locale, resolved container width, font load and actual text. A single grapheme or protected punctuation sequence may exceed an extremely narrow width."],
	],
	ja: [
		["はじめる", "互換パッケージをインストールし、言語を指定して実際の画面幅に合わせて改行します。localeを省略すると従来どおり韓国語が選択されます。"],
		["コアエンジン", "正の幅と同じ単位の測定関数を指定します。balancedは行数を優先し、余白や言語ごとの境界を考慮します。greedyは入る範囲で最も遠い境界を選びます。"],
		["強制改行", "文字列内部の書記素境界に対応するUTF-16位置を指定します。原文を変更せず、明示的な改行はbreakAfterに保持されます。"],
		["インラインマークアップ", "リンクや強調を含むテキスト要素にはinlineモードを使用します。入れ子のテキストマークアップを保持します。"],
		["HTMLとDOM", "要素にアダプターを適用するとフォントとコンテナ幅を測定します。要素削除時はdestroy、設定変更時はupdateを使用します。"],
		["ReactとNext.js", "WrapTextはハイドレーション後に要素を測定します。独自の描画にはuseKowrapで行データと強制改行を制御できます。"],
		["Vue", "ディレクティブを登録し、textとlocaleを指定します。既存のインライン内容にはinline: trueを使用します。"],
		["Svelte", "要素にアクションを指定します。リアクティブな設定変更に対応し、要素の削除時に後処理されます。"],
		["SSRとハイドレーション", "サーバーは最終的な幅やフォントを測定できません。SentenceTextはブラウザーAPIなしで文をグループ化し、WrapTextはハイドレーション後に測定します。"],
		["APIリファレンス", "コアはwrap、splitLines、segmentSentencesを提供します。browserとdomは互換パスであり、既存のフレームワークAPIも維持されます。"],
		["トラブルシューティング", "言語、コンテナ幅、フォント読み込み、原文を確認してください。極端に狭い幅では単一の書記素や句読点の組がはみ出すことがあります。"],
	],
	zh: [
		["快速开始", "安装兼容的软件包，选择语言，并根据实际排版宽度计算换行。省略 locale 时仍使用原来的韩语规则。"],
		["核心引擎", "传入正数宽度和相同单位的测量函数。balanced 优先最小化行数，再考虑剩余空间与语言边界；greedy 选择当前行最远的可用边界。"],
		["强制换行", "使用字符串内部字素边界对应的 UTF-16 偏移量。强制换行不修改原文，显式换行保存在 breakAfter 中。"],
		["内联标记", "含有链接和强调的文本元素使用 inline 模式，保留现有嵌套文本标记。"],
		["HTML 和 DOM", "在元素上挂载适配器以测量字体和容器宽度。移除元素时调用 destroy，更改设置时调用 update。"],
		["React 和 Next.js", "WrapText 在 hydration 后测量元素。自定义渲染可使用 useKowrap 获取行数据和强制换行控制。"],
		["Vue", "注册指令并传入 text 和 locale。对于已有的内联内容，使用 inline: true。"],
		["Svelte", "在元素上使用 action，响应式选项会更新换行结果，元素移除时清理控制器。"],
		["SSR 与 hydration", "服务端无法得知浏览器实际宽度和字体。SentenceText 无需浏览器 API 即可按句子分组，WrapText 在 hydration 后进行测量。"],
		["API 参考", "核心导出 wrap、splitLines 和 segmentSentences。browser 与 dom 是兼容入口，现有框架 API 保持兼容。"],
		["问题排查", "检查所选语言、容器实际宽度、字体加载和原文。极窄宽度下，单个字素或受保护的标点组合可能超出容器。"],
	],
} as const;
const slugs = ["start", "core", "forced-breaks", "inline", "dom", "react", "vue", "svelte", "ssr", "api", "troubleshooting"] as const;
export const translatedGuideSlugs = slugs;
export const translatedGuides = (locale: Exclude<SiteLocale, "ko">) => {
	const lang = engineLocale(locale);
	const sample = { en: "Read every line naturally.", ja: "文章を自然に読みやすく。", zh: "让每一行自然易读。" }[locale];
	const code = {
		start: ["bash", "pnpm add @oddmash/kowrap"],
		core: ["ts", `import { wrap } from '@oddmash/kowrap/${locale}';\n\nconst lines = wrap(${JSON.stringify(sample)}, {\n  width: 12,\n  measure: text => [...text].length,\n});`],
		"forced-breaks": ["ts", "import { splitLines } from '@oddmash/kowrap';\n\nconst lines = splitLines('A👩‍💻B', [1]);"],
		inline: ["ts", `import { mountKowrap } from '@oddmash/kowrap/dom';\n\nconst controller = mountKowrap(element, { inline: true, locale: '${lang}' });`],
		dom: ["ts", `import { mountKowrap } from '@oddmash/kowrap/dom';\n\nconst controller = mountKowrap(element, { text: ${JSON.stringify(sample)}, locale: '${lang}' });\ncontroller.destroy();`],
		react: ["tsx", `import { WrapText } from '@oddmash/kowrap/react';\n\n<WrapText as="h1" locale="${lang}">${sample}</WrapText>`],
		vue: ["vue", `<script setup>\nimport { kowrapDirective as vKowrap } from '@oddmash/kowrap/vue';\nconst text = ${JSON.stringify(sample)};\n</script>\n<template><p v-kowrap="{ text, locale: '${lang}' }"></p></template>`],
		svelte: ["svelte", `<script>\nimport { kowrap } from '@oddmash/kowrap/svelte';\nlet text = ${JSON.stringify(sample)};\n</script>\n<p use:kowrap={{ text, locale: '${lang}' }}></p>`],
		ssr: ["tsx", `import { SentenceText } from '@oddmash/kowrap/react/server';\n\n<SentenceText locale="${lang}">${sample}</SentenceText>`],
		api: ["ts", "import { wrap, splitLines, segmentSentences } from '@oddmash/kowrap';\nimport type { WrapLocale, WrapOptions, WrappedLine } from '@oddmash/kowrap';"],
		troubleshooting: ["ts", `const options = { locale: '${lang}', width, measure };`],
	};
	return slugs.map((slug, index) => {
		const [title, description] = descriptions[locale][index]!;
		const [format, snippet] = code[slug];
		const href = `${languagePath(locale)}/docs/${slug === "start" ? "" : slug + "/"}`;
		return { slug, title, group: landingCopy[locale].docs, href, body: description, format, snippet };
	});
};
