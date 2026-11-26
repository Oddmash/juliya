import { engineLocale, landingCopy, languagePath } from "./locales";
import type { SiteLocale } from "./locales";

const descriptions = {
	en: [
		["Getting started", "Install Juliya, select a language, and wrap text using actual layout measurements. Future updates are published only as @oddmash/juliya; Kowrap 0.4.0 is the final legacy version. Korean remains the default when locale is omitted."],
		["Core engine", "Pass a positive width and a non-negative measurement function in matching units. Balanced wrapping minimizes line count first, then considers remaining space and language boundaries; greedy selects the furthest fitting boundary."],
		["Forced breaks", "Offsets are UTF-16 positions at internal grapheme boundaries. Forced breaks do not alter the original text; explicit newlines remain in breakAfter."],
		["Inline markup", "Use inline mode for plain text elements with links or emphasis. Existing nested text markup is preserved. Late client mounting can show native wrapping first. Mount visible text early, and allow enough margin for lazy mounts before entering the viewport. Preload necessary fonts and choose a fallback; waiting for document.fonts.ready may reduce font-related reflows but delays enhancement. Keep fallback text accessible."],
		["HTML and DOM", "Mount the adapter on an element to measure its font and container width. Call destroy when removing the element; update to change options."],
		["React and Next.js", "Set the active language once with JuliyaProvider. JuliyaText and useJuliya inherit it unless their own locale is specified. With no provider, Korean remains the default. Map your application's i18n language tags to ko, en, ja, zh or zh-Hans. WrapText and useKowrap remain compatible aliases. Import the provider and consumers from the same package."],
		["Vue", "Register the directive and pass a text and locale. For existing inline content, use inline: true instead."],
		["Svelte", "Use the action on an element. Reactive options update the measured wrapping; removing the element cleans up the controller."],
		["SSR and hydration", "The server cannot know the browser's actual font or width. JuliyaSentenceText groups sentences without browser APIs and requires an explicit locale for languages other than Korean. It cannot read the client JuliyaProvider. JuliyaText measures after hydration. SentenceText remains a compatible alias."],
		["API reference", "Core exports wrap, splitLines and segmentSentences. Browser and DOM paths are aliases. React adds JuliyaText, useJuliya and JuliyaProvider. Existing React, Vue and Svelte exports remain compatible."],
		["Troubleshooting", "Check the selected locale, resolved container width, font load and actual text. A single grapheme or protected punctuation sequence may exceed an extremely narrow width."],
	],
	ja: [
		["はじめる", "Juliyaをインストールし、言語を指定して実際の画面幅に合わせて改行します。今後の更新は@oddmash/juliyaのみで提供します。Kowrap 0.4.0は最後の旧パッケージ版です。localeを省略すると従来どおり韓国語が選択されます。"],
		["コアエンジン", "正の幅と同じ単位の測定関数を指定します。balancedは行数を優先し、余白や言語ごとの境界を考慮します。greedyは入る範囲で最も遠い境界を選びます。"],
		["強制改行", "文字列内部の書記素境界に対応するUTF-16位置を指定します。原文を変更せず、明示的な改行はbreakAfterに保持されます。"],
		["インラインマークアップ", "リンクや強調を含むテキスト要素にはinlineモードを使用します。入れ子のテキストマークアップを保持します。クライアントでのマウントが遅い場合、先にブラウザー標準の改行が表示されます。画面内のテキストは早めにマウントし、遅延マウントは表示領域に入る前に余裕を持って行います。必要なフォントをプリロードし、代替フォントを指定してください。document.fonts.readyを待つと再計算を減らせますが、適用が遅れます。代替テキストを隠さないでください。"],
		["HTMLとDOM", "要素にアダプターを適用するとフォントとコンテナ幅を測定します。要素削除時はdestroy、設定変更時はupdateを使用します。"],
		["ReactとNext.js", "JuliyaProviderで使用言語を一度設定すると、JuliyaTextとuseJuliyaに継承されます。個別のlocaleを指定した場合はそちらが優先され、Providerがなければ韓国語になります。i18nの言語タグはko、en、ja、zh、zh-Hansに変換してください。従来のWrapTextとuseKowrapも利用できます。Providerとその利用側は同じパッケージから読み込みます。"],
		["Vue", "ディレクティブを登録し、textとlocaleを指定します。既存のインライン内容にはinline: trueを使用します。"],
		["Svelte", "要素にアクションを指定します。リアクティブな設定変更に対応し、要素の削除時に後処理されます。"],
		["SSRとハイドレーション", "サーバーは最終的な幅やフォントを測定できません。JuliyaSentenceTextはブラウザーAPIなしで文をグループ化します。クライアントのJuliyaProviderを参照できないため、韓国語以外ではlocaleを明示してください。JuliyaTextはハイドレーション後に測定します。従来のSentenceTextも利用できます。"],
		["APIリファレンス", "コアはwrap、splitLines、segmentSentencesを提供します。browserとdomは互換パスです。ReactではJuliyaText、useJuliya、JuliyaProviderを提供し、既存のフレームワークAPIも維持されます。"],
		["トラブルシューティング", "言語、コンテナ幅、フォント読み込み、原文を確認してください。極端に狭い幅では単一の書記素や句読点の組がはみ出すことがあります。"],
	],
	zh: [
		["快速开始", "安装 Juliya，选择语言，并根据实际排版宽度计算换行。今后的更新仅通过 @oddmash/juliya 发布。Kowrap 0.4.0 是最后一个旧软件包版本。省略 locale 时仍使用原来的韩语规则。"],
		["核心引擎", "传入正数宽度和相同单位的测量函数。balanced 优先最小化行数，再考虑剩余空间与语言边界；greedy 选择当前行最远的可用边界。"],
		["强制换行", "使用字符串内部字素边界对应的 UTF-16 偏移量。强制换行不修改原文，显式换行保存在 breakAfter 中。"],
		["内联标记", "含有链接和强调的文本元素使用 inline 模式，保留现有嵌套文本标记。客户端延迟挂载时可能先显示浏览器默认换行。可见文本应尽早挂载，延迟挂载应在进入视口前留出足够时间。预加载必要字体并指定备用字体；等待 document.fonts.ready 可以减少字体变化引起的重新计算，但会延迟增强。请保持备用文本可访问。"],
		["HTML 和 DOM", "在元素上挂载适配器以测量字体和容器宽度。移除元素时调用 destroy，更改设置时调用 update。"],
		["React 和 Next.js", "使用 JuliyaProvider 统一设置语言，JuliyaText 与 useJuliya 会继承该设置。单独指定的 locale 优先，没有 Provider 时默认使用韩语。请将 i18n 的语言标签映射到 ko、en、ja、zh 或 zh-Hans。原有 WrapText 与 useKowrap 仍可使用。Provider 和使用它的组件应从同一软件包导入。"],
		["Vue", "注册指令并传入 text 和 locale。对于已有的内联内容，使用 inline: true。"],
		["Svelte", "在元素上使用 action，响应式选项会更新换行结果，元素移除时清理控制器。"],
		["SSR 与 hydration", "服务端无法得知浏览器实际宽度和字体。JuliyaSentenceText 无需浏览器 API 即可按句子分组。它无法读取客户端 JuliyaProvider，因此非韩语内容需要显式传入 locale。JuliyaText 在 hydration 后进行测量。原有 SentenceText 仍可使用。"],
		["API 参考", "核心导出 wrap、splitLines 和 segmentSentences。browser 与 dom 是兼容入口。React 新增 JuliyaText、useJuliya 和 JuliyaProvider，原有框架 API 保持兼容。"],
		["问题排查", "检查所选语言、容器实际宽度、字体加载和原文。极窄宽度下，单个字素或受保护的标点组合可能超出容器。"],
	],
} as const;
const slugs = ["start", "core", "forced-breaks", "inline", "dom", "react", "vue", "svelte", "ssr", "api", "troubleshooting"] as const;
export const translatedGuideSlugs = slugs;
export const translatedGuides = (locale: Exclude<SiteLocale, "ko">) => {
	const lang = engineLocale(locale);
	const sample = { en: "Read every line naturally.", ja: "文章を自然に読みやすく。", zh: "让每一行自然易读。" }[locale];
	const code = {
		start: ["bash", "pnpm add @oddmash/juliya"],
		core: ["ts", `import { wrap } from '@oddmash/juliya/${locale}';\n\nconst lines = wrap(${JSON.stringify(sample)}, {\n  width: 12,\n  measure: text => [...text].length,\n});`],
		"forced-breaks": ["ts", "import { splitLines } from '@oddmash/juliya';\n\nconst lines = splitLines('A👩‍💻B', [1]);"],
		inline: ["ts", `import { mountKowrap } from '@oddmash/juliya/dom';\n\nconst controller = mountKowrap(element, { inline: true, locale: '${lang}' });`],
		dom: ["ts", `import { mountKowrap } from '@oddmash/juliya/dom';\n\nconst controller = mountKowrap(element, { text: ${JSON.stringify(sample)}, locale: '${lang}' });\ncontroller.destroy();`],
		react: ["tsx", `import { JuliyaProvider, JuliyaText } from '@oddmash/juliya/react';\n\n<JuliyaProvider locale="${lang}">\n  <JuliyaText as="h1">${sample}</JuliyaText>\n</JuliyaProvider>`],
		vue: ["vue", `<script setup>\nimport { kowrapDirective as vKowrap } from '@oddmash/juliya/vue';\nconst text = ${JSON.stringify(sample)};\n</script>\n<template><p v-kowrap="{ text, locale: '${lang}' }"></p></template>`],
		svelte: ["svelte", `<script>\nimport { kowrap } from '@oddmash/juliya/svelte';\nlet text = ${JSON.stringify(sample)};\n</script>\n<p use:kowrap={{ text, locale: '${lang}' }}></p>`],
		ssr: ["tsx", `import { JuliyaSentenceText } from '@oddmash/juliya/react/server';\n\n<JuliyaSentenceText locale="${lang}">${sample}</JuliyaSentenceText>`],
		api: ["ts", "import { wrap, splitLines, segmentSentences } from '@oddmash/juliya';\nimport type { WrapLocale, WrapOptions, WrappedLine } from '@oddmash/juliya';"],
		troubleshooting: ["ts", `const options = { locale: '${lang}', width, measure };`],
	};
	return slugs.map((slug, index) => {
		const [title, description] = descriptions[locale][index]!;
		const [format, snippet] = code[slug];
		const href = `${languagePath(locale)}/docs/${slug === "start" ? "" : slug + "/"}`;
		return { slug, title, group: landingCopy[locale].docs, href, body: description, format, snippet };
	});
};
