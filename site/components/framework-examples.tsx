"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@oddmash/ui/tabs";
import { CopyButton } from "./copy-button";
import { specimenText } from "../lib/specimen";

const examples = [
	{
		tab: "React",
		label: "React / Next.js",
		doc: "react",
		code: `import { WrapText } from '@oddmash/kowrap/react';\n\n<WrapText as="h1">\n  ${specimenText}\n</WrapText>`,
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
  import { mountKowrap } from 'https://cdn.jsdelivr.net/npm/@oddmash/kowrap@0.2.0/dist/dom/index.js/+esm';

  const title = document.getElementById('title');
  mountKowrap(title, { text: title.textContent });
</script>
</html>`,
	},
	{
		tab: "Core",
		label: "직접 폭을 측정하고 줄 데이터를 받는 API",
		doc: "core",
		code: `import { wrap } from '@oddmash/kowrap';\n\nconst lines = wrap(${JSON.stringify(specimenText)}, {\n  width: 8,\n  measure: text => [...text].length,\n});`,
	},
];

export const FrameworkExamples = () => {
	return (
		<Tabs defaultValue="React" className="code-window">
			<TabsList className="code-tabs" aria-label="환경별 예제">
				{examples.map(({ tab }) => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
			</TabsList>
			{examples.map((example) => <TabsContent key={example.tab} value={example.tab} className="framework-panel">
				<div className="code-body"><CopyButton className="copy-code" value={example.code} /><pre><code>{example.code}</code></pre></div>
				<div className="code-foot"><span>{example.label}</span><Link href={`/docs/${example.doc}/`}>사용 문서</Link></div>
			</TabsContent>)}
		</Tabs>
	);
};
