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
		label: "HTML / JavaScript",
		doc: "dom",
		code: `import { mountKowrap } from '@oddmash/kowrap/dom';\n\nconst element = document.querySelector('#title');\nmountKowrap(element, {\n  text: ${JSON.stringify(specimenText)}\n});`,
	},
	{
		tab: "Core",
		label: "JavaScript / TypeScript",
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
