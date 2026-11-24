"use client";

import Link from "next/link";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@oddmash/ui/tabs";
import { CopyButton } from "./copy-button";
import { specimenText } from "../lib/specimen";
import { landingCopy, languagePath, engineLocale } from "../lib/locales";
import type { SiteLocale } from "../lib/locales";

const examples = [
	{
		tab: "React",
		label: "React / Next.js",
		doc: "react",
		code: `import { JuliyaProvider, JuliyaText } from '@oddmash/kowrap/react';\n\n<JuliyaProvider locale="ko">\n  <JuliyaText as="h1">\n    ${specimenText}\n  </JuliyaText>\n</JuliyaProvider>`,
	},
	{
		tab: "Vue",
		label: "Vue 3",
		doc: "vue",
		code: `<script setup>\nimport { kowrapDirective as vKowrap } from '@oddmash/kowrap/vue';\nconst text = ${JSON.stringify(specimenText)};\n</script>\n\n<template>\n  <p v-kowrap="{ text }"></p>\n</template>`,
	},
	{
		tab: "Svelte",
		label: "Svelte 5",
		doc: "svelte",
		code: `<script>\n  import { kowrap } from '@oddmash/kowrap/svelte';\n  let text = $state(${JSON.stringify(specimenText)});\n</script>\n\n<p use:kowrap={{ text }}></p>`,
	},
	{
		tab: "HTML",
		label: "npm 설치 없이 index.html로 저장해 열기",
		doc: "dom",
		code: `<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<title>Kowrap 예제</title>
<p id="title" style="max-width: 220px; font-size: 24px">${specimenText}</p>
<script type="module">
  import { mountKowrap } from 'https://cdn.jsdelivr.net/npm/@oddmash/kowrap@0.3.0/dist/dom/index.js/+esm';

  const title = document.getElementById('title');
  mountKowrap(title, { text: title.textContent });
</script>
</html>`,
	},
	{
		tab: "Core",
		label: "픽셀 단위로 측정하고 줄 데이터 받기",
		doc: "core",
		code: `import { wrap } from '@oddmash/kowrap';\nimport { createCanvasMeasure } from '@oddmash/kowrap/dom';\n\nawait document.fonts.ready;\nconst measure = createCanvasMeasure({ font: '400 24px sans-serif' });\nconst lines = wrap(${JSON.stringify(specimenText)}, {\n  width: 280,\n  measure,\n});\n\nconsole.log(lines.map(line => line.text));`,
	},
];

export const FrameworkExamples = ({ locale = "ko" }: { locale?: SiteLocale }) => {
	const [active, setActive] = useState("React");
	const samples = { ko: specimenText, en: "Make every line easier to read.", ja: "文章をもっと読みやすく。", zh: "让每一行更容易阅读。" };
	const localized = locale === "ko" ? examples : examples.map(example => ({
		...example,
		label: example.tab,
		code: example.tab === "HTML"
			? `import { mountKowrap } from '@oddmash/kowrap/dom';\n\nconst title = document.getElementById('title');\nmountKowrap(title, { text: title.textContent, locale: '${engineLocale(locale)}' });`
			: example.code.replaceAll(specimenText, samples[locale]).replace('<JuliyaProvider locale="ko">', `<JuliyaProvider locale="${engineLocale(locale)}">`).replace("{ text }", `{ text, locale: '${engineLocale(locale)}' }`).replace("{{ text }}", `{{ text, locale: '${engineLocale(locale)}' }}`).replace("  width: 280,", `  locale: '${engineLocale(locale)}',\n  width: 280,`),
	}));
	const selected = localized.find(example => example.tab === active) ?? localized[0];
	return (
		<Tabs value={active} onValueChange={setActive} className="code-window">
			<div className="code-toolbar">
			<TabsList className="code-tabs" aria-label="환경별 예제">
				{examples.map(({ tab }) => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
			</TabsList>
			<CopyButton key={selected.tab} className="copy-code" value={selected.code} icon />
			</div>
			{localized.map((example) => <TabsContent key={example.tab} value={example.tab} className="framework-panel">
				<div className="code-body"><pre><code>{example.code}</code></pre></div>
				<div className="code-foot"><span>{example.label}</span><Link href={locale === "ko" ? `/docs/${example.doc}/` : `${languagePath(locale)}/docs/`}>{locale === "ko" ? "사용 문서" : landingCopy[locale].docs}</Link></div>
			</TabsContent>)}
		</Tabs>
	);
};
