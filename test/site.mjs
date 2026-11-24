import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { renderMarkdown } from "../site/lib/markdown.mjs";

const output = new URL("../site/out/", import.meta.url);
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const read = (path) => readFileSync(new URL(path, output), "utf8");

test("Next export includes actual native and kowrap examples and synchronized code", () => {
	const html = read("index.html");
	assert.match(html, /id="native-preview"/);
	assert.match(html, /id="kowrap-preview"/);
	assert.doesNotMatch(html, /id="inline-preview"/);
	assert.match(html, /class="text-link inline-guide-link"/);
	assert.match(html, /<div id="editor"/);
	assert.match(html, /id="demo-width"/);
	assert.match(html, /id="demo-text"/);
	assert.doesNotMatch(html, /Oddmash에서 만든 한국어 줄바꿈 라이브러리/);
	assert.match(html, /--paper:#faf9f6/);
	assert.match(html, /--ink:#232822/);
	assert.match(html, /내 문장으로 비교하기/);
	assert.match(html, /data-om-theme="light"/);
	assert.match(html, /aria-keyshortcuts="Meta\+K Control\+K"/);
	assert.doesNotMatch(html, /id="hero-title"[^>]*>[^<]*<br/);
	assert.match(html, /적용 전 \(CSS keep-all\)/);
	assert.match(html, /적용 후 \(kowrap\)/);
	assert.ok(html.includes(`${basePath}/_next/`));
	assert.ok(html.includes(`${basePath}/docs/`));
	assert.ok(html.includes("@oddmash/kowrap/react"));
	assert.ok(existsSync(new URL(".nojekyll", output)));
});

test("all Markdown guides are prerendered and have base-path-safe navigation", () => {
	for (const slug of [
		"core",
		"forced-breaks",
		"inline",
		"dom",
		"react",
		"vue",
		"svelte",
		"ssr",
		"api",
		"troubleshooting",
	]) {
		const html = read(`docs/${slug}/index.html`);
		assert.ok(html.includes("doc-content"));
		assert.ok(html.includes(`${basePath}/docs/`));
		assert.ok(html.includes("문서 검색"));
	}
	const start = read("docs/index.html");
	assert.ok(start.includes(`${basePath}/docs/core/`));
	assert.ok(start.includes("npm install @oddmash/kowrap"));
	assert.match(start, /aria-label="패키지 매니저"/);
	assert.match(start, /data-copy-target="code-1-npm"/);
	assert.match(start, /id="code-1-pnpm-panel"[^>]*hidden/);
	assert.match(start, /id="code-1-yarn-panel"[^>]*hidden/);
});

test("Markdown escapes raw HTML and disallowed URLs and generates headings and code", () => {
	const result = renderMarkdown(
		"# 시작\n\n## 사용법\n\n<script>alert(1)</script> [코어](core.md) [bad](javascript://alert)\n\n```ts\nconst value = '<tag>';\n```",
		"/kowrap",
	);
	assert.equal(result.title, "시작");
	assert.deepEqual(result.headings, [
		{ level: 2, text: "사용법", id: "사용법" },
	]);
	assert.match(result.html, /&lt;script&gt;/);
	assert.match(result.html, /href="\/kowrap\/docs\/core\/"/);
	assert.doesNotMatch(result.html, /href="javascript:/);
	assert.match(result.html, /&lt;tag&gt;/);
	assert.match(result.html, /data-copy-target="code-1"/);
	assert.match(result.html, /class="syntax-keyword">const<\/span>/);
	assert.match(result.html, /class="syntax-string">&#39;&lt;tag&gt;&#39;<\/span>/);
});
