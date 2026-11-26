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
	assert.match(html, /<section id="editor"/);
	assert.match(html, /id="demo-width"/);
	assert.match(html, /id="demo-text"/);
	assert.doesNotMatch(html, /Oddmash에서 만든 한국어 줄바꿈 라이브러리/);
	assert.match(html, /--paper:#09090b/);
	assert.match(html, /--ink:#fafafa/);
	assert.match(html, /내 문장으로 확인하기/);
	assert.match(html, /data-om-theme="dark"/);
	assert.match(html, /aria-keyshortcuts="Meta\+K Control\+K"/);
	assert.match(html, /id="hero-title"[^>]*>줄이야/);
	assert.doesNotMatch(html, /한국어를 위한 오픈소스 줄바꿈 엔진/);
	assert.match(html, /기본 CSS/);
	assert.match(html, /Juliya/);
	assert.ok(html.includes(`${basePath}/_next/`));
	assert.ok(html.includes(`${basePath}/docs/`));
	assert.ok(html.includes(`https://github.com/Oddmash/${basePath.split("/").filter(Boolean).at(-1) ?? "juliya"}`));
	assert.ok(html.includes("@oddmash/juliya/react"));
	assert.ok(html.includes("JuliyaProvider"));
	assert.ok(html.includes("JuliyaText"));
	assert.ok(existsSync(new URL(".nojekyll", output)));
});

test("initial HTML declares the page language without client JavaScript", () => {
	const locales = [
		["", "ko", "본문 바로가기"],
		["en/", "en", "Skip to main content"],
		["ja/", "ja", "本文へ移動"],
		["zh/", "zh-Hans", "跳到主要内容"],
	];
	for (const [prefix, lang, skipLabel] of locales) {
		for (const route of ["index.html", "docs/index.html", "docs/core/index.html"]) {
			const path = prefix + route;
			const html = read(path);
			assert.equal(html.match(/<html\b[^>]*\blang="([^"]+)"/)?.[1], lang, path);
			assert.ok(html.includes(`href="#main">${skipLabel}</a>`), path);
		}
	}
});

test("the exported 404 retains a Korean document and home link", () => {
	const html = read("404.html");
	assert.match(html, /<html\b[^>]*\blang="ko"/);
	assert.match(html, /<h1>페이지를 찾을 수 없습니다<\/h1>/);
	assert.ok(html.includes(`href="${basePath}/">홈으로 돌아가세요.`));
});

test("translated landing and reference routes are exported", () => {
	for (const language of ["en", "ja", "zh"]) {
		assert.match(read(`${language}/index.html`), /Juliya/);
		const start = read(`${language}/docs/index.html`);
		assert.ok(start.includes("pnpm add @oddmash/juliya"));
		assert.ok(start.includes(`${basePath}/${language}/docs/`));
		assert.ok(start.includes(`${basePath}/${language}/docs/core/`));
		assert.match(start, /aria-current="page"/);
		assert.ok(read(`${language}/docs/core/index.html`).includes(`@oddmash/juliya/${language}`));
		for (const slug of ["forced-breaks", "inline", "dom", "react", "vue", "svelte", "ssr", "api", "troubleshooting"]) {
			assert.ok(existsSync(new URL(`${language}/docs/${slug}/index.html`, output)));
		}
	}
});

test("exported playground uses labeled shared Oddmash sliders", () => {
	for (const route of ["index.html", "en/index.html", "ja/index.html", "zh/index.html"]) {
		const html = read(route);
		for (const id of ["demo-width", "font-size"]) {
			const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0];
			assert.ok(input, `${route} contains ${id}`);
			assert.match(input, /\bclass="[^\"]*\bom-slider\b/);
			assert.match(input, /\btype="range"/);
			assert.match(html, new RegExp(`<label[^>]*for="${id}"`));
		}
	}
});

test("localized READMEs point to the matching exported documentation and editor", () => {
	const readmes = [
		["en", "../README.md"],
		["", "../docs/readme/ko.md"],
		["ja", "../docs/readme/ja.md"],
		["zh", "../docs/readme/zh.md"],
	];
	for (const [language, path] of readmes) {
		const source = readFileSync(new URL(path, import.meta.url), "utf8");
		const prefix = language ? `${language}/` : "";
		assert.ok(source.includes(`https://oddmash.github.io/juliya/${prefix}docs/`));
		assert.ok(source.includes(`https://oddmash.github.io/juliya/${prefix}#editor`));
		assert.ok(source.includes("@oddmash/kowrap@0.4.0"));
		assert.ok(source.includes("@oddmash/juliya"));
		for (const locale of ["ko", "ja", "zh"]) {
			assert.ok(source.includes(`https://github.com/Oddmash/juliya/blob/main/docs/readme/${locale}.md`));
		}
		assert.match(read(`${prefix}index.html`), /id="editor"/);
		assert.ok(existsSync(new URL(`${prefix}docs/index.html`, output)));
	}
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
	assert.ok(start.includes("npm install @oddmash/juliya"));
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


test("shared site controls preserve prerendered native documentation and language links", () => {
	const html = read("index.html");
	assert.match(html, /om-site-header/);
	assert.match(html, /om-site-footer/);
	assert.match(html, /om-site-nav/);
	assert.match(html, /om-clipboard-button/);
	assert.match(html, /om-toast-viewport/);
	assert.match(html, /om-platform-link/);
	assert.match(html, /om-kbd/);
	assert.match(html, /om-locale-fallback/);
	assert.ok(html.includes(`href="${basePath}/en/"`));
	assert.match(html, new RegExp(`<a[^>]*class="[^"]*om-button[^"]*button-primary[^"]*"[^>]*href="${basePath}/docs/"|<a[^>]*href="${basePath}/docs/"[^>]*class="[^"]*om-button[^"]*button-primary[^"]*"`));
	const docs = read("docs/index.html");
	assert.match(docs, /om-docs-navigation/);
	assert.match(docs, /om-table-of-contents/);
	assert.match(docs, /om-prose/);
	assert.match(docs, /om-code-block-content/);
	assert.ok(docs.includes(`href="${basePath}/docs/core/"`));
});

test("localized brand links are prerendered on landing and documentation pages", () => {
	for (const [language, label, name] of [["", "줄이야 홈", "줄이야"], ["en", "Juliya home", "Juliya"], ["ja", "Juliya ホーム", "Juliya"], ["zh", "Juliya 首页", "Juliya"]]) {
		const prefix = language ? `${language}/` : "";
		const href = `${basePath}/${prefix}`;
		for (const path of [`${prefix}index.html`, `${prefix}docs/index.html`]) {
			const html = read(path);
			const links = [...html.matchAll(/<a\b[^>]*class="brand"[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
			assert.equal(links.length, 2);
			for (const link of links) {
				assert.ok(link.includes(`href="${href}"`));
				assert.ok(link.includes(`aria-label="${label}"`));
				assert.ok(link.includes(`class="brand-name">${name}</span>`));
			}
		}
	}
});


test("sitemap lists every public localized route and only exported pages", () => {
	const xml = read("sitemap.xml");
	const origin = "https://oddmash.github.io/juliya/";
	const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
	const expected = ["comparison/"];
	for (const prefix of ["", "en/", "ja/", "zh/"]) {
		expected.push(prefix, prefix + "docs/");
		for (const slug of ["core", "forced-breaks", "inline", "dom", "react", "vue", "svelte", "ssr", "api", "troubleshooting"]) {
			expected.push(prefix + "docs/" + slug + "/");
		}
	}
	assert.deepEqual(urls.sort(), expected.map(route => origin + route).sort());
	for (const route of expected) assert.ok(existsSync(new URL(route + "index.html", output)), route);
});
