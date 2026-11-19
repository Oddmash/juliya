"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "./copy-button";

const examples = [
	{
		tab: "React",
		label: "React / Next.js",
		doc: "react",
		code: `import { WrapText } from '@oddmash/kowrap/react';\n\n<WrapText as="h1">\n  한국어를 읽는 흐름대로.\n</WrapText>`,
	},
	{
		tab: "Vue",
		label: "Vue 3",
		doc: "vue",
		code: `<script setup>\nimport { kowrapDirective as vKowrap } from '@oddmash/kowrap/vue';\nconst text = '한국어를 읽는 흐름대로.';\n</script>\n\n<template>\n  <p v-kowrap="{ text }"></p>\n</template>`,
	},
	{
		tab: "Svelte",
		label: "Svelte 5",
		doc: "svelte",
		code: `<script>\n  import { kowrap } from '@oddmash/kowrap/svelte';\n  let text = $state('한국어를 읽는 흐름대로.');\n</script>\n\n<p use:kowrap={{ text }}></p>`,
	},
	{
		tab: "HTML",
		label: "HTML / JavaScript",
		doc: "dom",
		code: `import { mountKowrap } from '@oddmash/kowrap/dom';\n\nconst element = document.querySelector('#title');\nmountKowrap(element, {\n  text: '한국어를 읽는 흐름대로.'\n});`,
	},
	{
		tab: "Core",
		label: "JavaScript / TypeScript",
		doc: "core",
		code: `import { wrap } from '@oddmash/kowrap';\n\nconst lines = wrap('한국어를 읽는 흐름대로.', {\n  width: 8,\n  measure: text => [...text].length,\n});`,
	},
];

export const FrameworkExamples = () => {
	const [active, setActive] = useState(0);
	const example = examples[active]!;
	return (
		<div className="code-window">
			<div className="code-tabs" role="tablist" aria-label="환경별 예제">
				{examples.map(({ tab }, index) => (
					<button
						key={tab}
						id={`framework-tab-${index}`}
						type="button"
						role="tab"
						aria-selected={active === index}
						aria-controls="framework-panel"
						tabIndex={active === index ? 0 : -1}
						onClick={() => setActive(index)}
						onKeyDown={(event) => {
							const next =
								event.key === "ArrowRight"
									? (index + 1) % examples.length
									: event.key === "ArrowLeft"
										? (index + examples.length - 1) % examples.length
										: event.key === "Home"
											? 0
											: event.key === "End"
												? examples.length - 1
												: -1;
							if (next >= 0) {
								event.preventDefault();
								setActive(next);
								document.getElementById(`framework-tab-${next}`)?.focus();
							}
						}}
					>
						{tab}
					</button>
				))}
			</div>
			<div
				className="code-body"
				id="framework-panel"
				role="tabpanel"
				aria-labelledby={`framework-tab-${active}`}
			>
				<CopyButton className="copy-code" value={example.code} />
				<pre>
					<code>{example.code}</code>
				</pre>
			</div>
			<div className="code-foot">
				<span>{example.label}</span>
				<Link href={`/docs/${example.doc}/`}>사용 문서</Link>
			</div>
		</div>
	);
};
