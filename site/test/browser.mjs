import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium, firefox, webkit } from "playwright";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const types = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript",
	".css": "text/css",
	".svg": "image/svg+xml",
	".woff2": "font/woff2",
	".json": "application/json",
	".txt": "text/plain; charset=utf-8",
};
const server = createServer(async (request, response) => {
	try {
		const pathname = decodeURIComponent(
			new URL(request.url, "http://localhost").pathname,
		);
		if (
			basePath &&
			pathname !== basePath &&
			!pathname.startsWith(`${basePath}/`)
		)
			throw new Error("Outside base path");
		const relative = pathname.slice(basePath.length).replace(/^\/+/, "");
		let path = resolve(root, relative);
		if (path !== resolve(root) && !path.startsWith(`${resolve(root)}${sep}`))
			throw new Error("Outside site root");
		if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
		const body = await readFile(path);
		response.writeHead(200, {
			"Content-Type": types[extname(path)] ?? "application/octet-stream",
		});
		response.end(body);
	} catch {
		response.writeHead(404);
		response.end();
	}
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}${basePath}`;
const verifySpecimen = async (page, motion) => {
	await page.evaluate(() => document.fonts.ready);
	await page.locator(".specimen-applied .specimen-text br").first().waitFor({ state: "attached" });
	const compare = async () => {
		assert.equal(await page.locator(".specimen-text:visible").count(), 2);
		const [css, kowrap] = await page.locator(".specimen-text").evaluateAll(samples => samples.map(sample => {
			const style = getComputedStyle(sample);
			return [sample.textContent, style.width, style.font, style.letterSpacing, style.whiteSpace, style.wordBreak, style.overflowWrap, style.textWrap];
		}));
		assert.deepEqual(css, kowrap, "both panels use the same text and rendering constraints");
		assert.equal(await page.locator(".specimen-panels").evaluate(panel => {
			const bounds = panel.getBoundingClientRect();
			return bounds.left >= 0 && bounds.right <= innerWidth + 1;
		}), true);
		await page.waitForFunction(() => {
			const width = Number(document.querySelector(".specimen-panels")?.getAttribute("data-measured-width"));
			return width > 0 && [...document.querySelectorAll(".specimen-text")].every(sample => Math.abs(sample.getBoundingClientRect().width - width) <= 1);
		});
		await page.waitForFunction(() => [...document.querySelectorAll(".specimen-stage")].every(stage => Math.abs(stage.querySelector(".specimen-ruler > span").getBoundingClientRect().width - stage.querySelector(".specimen-text").getBoundingClientRect().width) <= 1));
		assert.ok(await page.locator(".specimen-text").evaluateAll(samples => samples.every(sample => {
			const words = [...sample.querySelectorAll(".specimen-word-visual")].map(word => word.getBoundingClientRect());
			return words.every((word, index) => words.slice(index + 1).every(other =>
				word.right <= other.left + 1 || other.right <= word.left + 1 || word.bottom <= other.top + 1 || other.bottom <= word.top + 1
			));
		})), "words do not overlap");
	};
	await compare();
	const panels = page.locator(".specimen-panels");
	const first = await panels.getAttribute("data-example");
	const firstWidth = await page.locator(".specimen-panels").getAttribute("data-measured-width");
	if (motion) {
		assert.equal(await page.locator(".specimen-word-visual").first().evaluate(element => getComputedStyle(element).animationName), "specimen-word-enter");
		assert.equal(await page.locator(".specimen-progress, .specimen-footer, .landing-proof-note").count(), 0);
		await page.locator(".specimen-motion").waitFor({ state: "attached" });
		assert.ok(await page.locator(".specimen-motion").evaluate(element => {
			const style = element.style;
			const panel = element.parentElement.getBoundingClientRect();
			const source = element.parentElement.querySelector(".specimen-native [data-moved]")?.getBoundingClientRect();
			const target = element.parentElement.querySelector(".specimen-applied [data-moved]")?.getBoundingClientRect();
			if (!source || !target) return false;
			const close = (a, b) => Math.abs(a - b) <= 2;
			const x = parseFloat(style.getPropertyValue("--motion-x"));
			const y = parseFloat(style.getPropertyValue("--motion-y"));
			const dx = parseFloat(style.getPropertyValue("--motion-dx"));
			const dy = parseFloat(style.getPropertyValue("--motion-dy"));
			return element.getAttribute("aria-hidden") === "true" && getComputedStyle(element).pointerEvents === "none" &&
				getComputedStyle(element).animationName === "specimen-route" &&
				close(x, source.left + source.width / 2 - panel.left) && close(y, source.bottom - panel.top + 5) &&
				close(x + dx, target.left + target.width / 2 - panel.left) && close(y + dy, target.bottom - panel.top + 5);
		}), "the animated cue is a measured non-interactive decoration");
	}
	assert.equal(await page.getByRole("button", { name: /자동 재생/ }).count(), 0);
	if (motion) {
		await panels.scrollIntoViewIfNeeded();
		await page.waitForFunction(index => document.querySelector(".specimen-panels").dataset.example !== index, first);
		await page.waitForFunction(width => document.querySelector(".specimen-panels").dataset.measuredWidth && document.querySelector(".specimen-panels").dataset.measuredWidth !== width, firstWidth);
		await compare();
	} else {
		assert.equal(await panels.getAttribute("data-example"), first);
		assert.equal(await page.locator(".specimen-text").first().evaluate(element => element.getAnimations().length), 0);
		assert.equal(await page.locator(".specimen-motion").count(), 0);
		assert.equal(await page.locator(".specimen-word-visual").first().evaluate(element => getComputedStyle(element).animationName), "none");
	}
	const selection = page.locator(".specimen").getByRole("button", { name: "서비스 제목" });
	await selection.press("Enter");
	assert.equal(await selection.getAttribute("aria-pressed"), "true");
	assert.equal(await panels.getAttribute("data-example"), "0");
	await page.mouse.move(0, 0);
	await page.locator("#editor").focus();
	await page.waitForTimeout(4900);
	assert.equal(await panels.getAttribute("data-example"), "0", "manual selection stops automatic progression");
	assert.equal(await page.locator(".specimen").getAttribute("data-rotating"), "false");
	await compare();
};
const verifyLandingGeometry = async (page) => {
	assert.equal(await page.locator(".specimen-footer, .specimen-progress, .landing-proof-note").count(), 0);
	assert.ok(await page.locator(".code-toolbar").evaluate(toolbar => {
		const list = toolbar.querySelector(".code-tabs");
		const copy = toolbar.querySelector(".copy-code");
		const { top, bottom, left, right } = toolbar.getBoundingClientRect();
		const inside = element => {
			const box = element.getBoundingClientRect();
			return box.top >= top && box.bottom <= bottom + 1 && box.left >= left && box.right <= right + 1;
		};
		return getComputedStyle(list).overflowY === "visible" && list.scrollHeight <= list.clientHeight + 1 &&
			[...list.querySelectorAll('[role="tab"]'), copy].every(inside) &&
			document.querySelector("#install").compareDocumentPosition(document.querySelector("#editor")) & Node.DOCUMENT_POSITION_FOLLOWING;
	}), "framework tabs have no internal scrollbar, controls fit, and installation precedes the editor");
};
let browser;
try {
	const engines = { chromium, firefox, webkit };
	const engine = engines[process.argv[2] ?? "chromium"];
	assert.ok(engine, "Choose chromium, firefox or webkit");
	browser = await engine.launch();
	const errors = [];
	const openPage = async (viewport) => {
		const page = await browser.newPage({ viewport });
		page.on("pageerror", (error) => errors.push({ page: page.url(), error: error.stack }));
		return page;
	};
	const desktop = { width: 1280, height: 900 };
	const comparison = await openPage(desktop);
	await comparison.goto(`${origin}/comparison/`);
	await comparison.getByRole('button', { name: '비교 실행' }).click();
	await comparison.getByText('측정 완료', { exact: true }).waitFor();
	assert.equal(await comparison.getByRole('row').count(), 3);
	assert.equal(await comparison.getByRole('rowheader', { name: 'Kowrap' }).count(), 1);
	await comparison.close();
	const page = await openPage(desktop);
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`);
	assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), "light");
	assert.equal(await page.locator("#hero-title").textContent(), "한국어를 읽는 흐름에 맞춰.");
	assert.ok(await page.locator(".specimen-native .specimen-text").evaluate(async (title) => {
		await document.fonts.ready;
		const family = getComputedStyle(title).fontFamily.split(",")[0];
		return [...document.fonts].some((face) => face.family.replaceAll('"', "") === family.replaceAll('"', "") && face.status === "loaded");
	}), "the locally hosted display face loads");
	assert.equal(await page.locator("#editor #demo-text").isVisible(), true);
	await verifySpecimen(page, true);
	await verifyLandingGeometry(page);
	assert.equal(await page.locator(".use-case").count(), 3);
	assert.ok(await page.locator(".use-case").evaluateAll(cases => cases.every(item => {
		const native = item.querySelector(".case-native .case-text");
		const applied = item.querySelector(".case-applied .case-text");
		return native.textContent === applied.textContent && Math.abs(native.getBoundingClientRect().width - applied.getBoundingClientRect().width) <= 1;
	})), "use case previews compare identical text at equal widths");
	assert.ok(await page.locator(".use-case").evaluateAll(cases => cases.some(item => {
		const linePositions = selector => {
			const words = [...item.querySelectorAll(selector)].map(word => word.getBoundingClientRect());
			return words.map(word => Math.round(word.top - words[0].top));
		};
		return JSON.stringify(linePositions(".case-native [data-case-word]")) !== JSON.stringify(linePositions(".case-applied [data-case-word]"));
	})), "real use case examples exhibit a line-position change");
	if (engine.name() === "chromium") {
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
		await page.screenshot({ path: "test-results/renewal/landing-desktop.png", fullPage: true, animations: "disabled" });
	}
	await page.getByRole("link", { name: "내 문장으로 체험하기" }).click();
	assert.equal(new URL(page.url()).hash, "#editor");
	assert.equal(await page.locator("#editor").evaluate((editor) => document.activeElement === editor), true);
	assert.equal(await page.locator(".inline-details").count(), 0);
	assert.match(await page.locator(".inline-guide-link").getAttribute("href"), /docs\/inline\/$/);
	await page
		.locator("#kowrap-preview br")
		.first()
		.waitFor({ state: "attached" });
	assert.equal(await page.locator("#native-preview br").count(), 0);
	assert.equal(
		await page.locator("#native-preview").textContent(),
		await page.locator("#kowrap-preview").textContent(),
	);
	const range = page.locator("#demo-width");
	await page.locator(".preview-ruler > span").first().evaluate((marker) => {
		marker.addEventListener("transitionrun", (event) => {
			if (event.propertyName === "transform") marker.dataset.animated = "true";
		});
	});
	await range.press("Home");
	await page.waitForFunction(() => [...document.querySelectorAll("#native-preview, #kowrap-preview")]
		.every((element) => Math.abs(element.getBoundingClientRect().width - 180) < 1));
	await page.locator(".preview-ruler > span[data-animated]").waitFor({ state: "attached" });
	await range.press("End");
	await range.press("ArrowLeft");
	await page.waitForFunction(() => [...document.querySelectorAll(".preview-ruler > span")].every((marker) => {
		const width = marker.closest(".preview-stage").querySelector(".preview-text").getBoundingClientRect().width;
		const transform = new DOMMatrixReadOnly(getComputedStyle(marker).transform);
		return Math.abs(transform.m41 - width) < 1 && width === 456;
	}));
	assert.equal(await page.locator(".preview-ruler > span").first().evaluate((marker) => getComputedStyle(marker).transitionProperty), "transform");
	await range.press("Home");
	await page.locator(".comparison-featured summary").press("Enter");
	assert.equal(await page.locator(".comparison-featured details").getAttribute("open"), "");
	await page.getByRole("button", { name: "혼합 문장" }).click();
	await page.waitForFunction(() =>
		document
			.getElementById("kowrap-preview")
			?.textContent.includes("TypeScript"),
	);
	await page.locator("#demo-text").evaluate((element) => {
		const offset = element.value.indexOf("TypeScript");
		element.setSelectionRange(offset, offset);
	});
	await page.getByText("고급 설정: 강제 개행", { exact: true }).click();
	await page.getByRole("button", { name: "커서 위치에서 개행" }).click();
	await page.waitForFunction(() =>
		document
			.querySelector(".comparison-featured pre")
			?.textContent.includes("forcedBreaks"),
	);
	await page.getByRole("button", { name: "개행 초기화" }).click();
	await page.waitForFunction(
		() =>
			!document
				.querySelector(".comparison-featured pre")
				?.textContent.includes("forcedBreaks"),
	);
	await page.getByRole("tab", { name: "Vue", exact: true }).click();
	assert.ok(
		(await page.getByRole("tabpanel").textContent()).includes(
			"kowrapDirective",
		),
	);
	await page.getByRole("tab", { name: "Core", exact: true }).click();
	assert.match(await page.getByRole("tabpanel").locator("pre code").textContent(), /createCanvasMeasure/);
	await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (value) => { window.copiedText = value; } } }));
	const copy = page.locator(".code-toolbar").getByRole("button", { name: "복사", exact: true });
	const coreSnippet = await page.getByRole("tabpanel").locator("pre code").textContent();
	await copy.press("Enter");
	await page.locator(".code-toolbar").getByRole("button", { name: "복사 완료", exact: true }).waitFor();
	await page.locator(".copy-toast-region .om-toast").getByRole("status").getByText("복사 완료", { exact: true }).waitFor();
	assert.equal(await page.evaluate(() => window.copiedText), coreSnippet);
	assert.equal(await page.locator(".code-toolbar .copy-code").evaluate(button => document.activeElement === button), true);
	assert.equal(await page.locator(".copy-toast-region .om-toast").count(), 1);
	assert.ok(await page.locator(".code-body:visible").evaluate(body => parseFloat(getComputedStyle(body).paddingTop) <= 20), "code starts close to the toolbar");
	await page.locator(".copy-toast-region").getByRole("button", { name: "알림 닫기" }).click();
	await page.locator(".copy-toast-region .om-toast").waitFor({ state: "hidden" });
	await page.locator(".code-toolbar").getByRole("button", { name: "복사", exact: true }).waitFor();
	await page.getByRole("tab", { name: "HTML", exact: true }).click();
	const landingHtml = await page.getByRole("tabpanel").locator("pre code").textContent();
	const htmlGuide = await openPage(desktop);
	await htmlGuide.goto(`${origin}/docs/dom/`);
	const guideHtml = await htmlGuide.locator("#doc-content pre code").first().textContent();
	assert.equal(guideHtml.trim(), landingHtml.trim(), "The guide and landing publish the same standalone HTML");
	assert.match(landingHtml, /https:\/\/cdn\.jsdelivr\.net\/npm\/@oddmash\/kowrap@\d+\.\d+\.\d+\/dist\/dom\/index\.js\/\+esm/);
	const readme = await readFile(new URL("../../README.md", import.meta.url), "utf8");
	const readmeHtml = readme.match(/^```html\r?\n([\s\S]+?)^```$/m)?.[1].trim();
	assert.equal(readmeHtml, landingHtml.trim(), "The README publishes the same standalone HTML");
	const staticPage = await openPage(desktop);
	const exampleDir = await mkdtemp(resolve(tmpdir(), "kowrap-cdn-"));
	try {
		const exampleFile = resolve(exampleDir, "index.html");
		await writeFile(exampleFile, readmeHtml);
		await staticPage.goto(pathToFileURL(exampleFile).href);
		await staticPage.locator("#title > br").first().waitFor({ state: "attached" });
	} finally {
		await rm(exampleDir, { recursive: true, force: true });
	}
	// Separate entry points so a forced page unload cannot abort an active prefetch.
	const docs = await openPage(desktop);
	await docs.goto(`${origin}/docs/`);
	await docs.locator("#doc-content h1[data-kowrap-prose]").waitFor({ state: "attached" });
	const installTabs = docs.getByRole("tablist", { name: "패키지 매니저" });
	const docCopy = docs.locator("[data-package-tabs] [data-copy-target]");
	await docs.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (value) => { window.copiedText = value; } } }));
	assert.equal(await docs.locator("[data-package-tabs] [role=tabpanel]:visible pre code").textContent(), "npm install @oddmash/kowrap");
	await docCopy.click();
	await docs.locator(".copy-toast-region .om-toast").getByRole("status").getByText("복사 완료", { exact: true }).waitFor();
	assert.equal(await docs.evaluate(() => window.copiedText), "npm install @oddmash/kowrap");
	await installTabs.getByRole("tab", { name: "npm", exact: true }).press("ArrowRight");
	assert.equal(await installTabs.getByRole("tab", { name: "pnpm", exact: true }).getAttribute("aria-selected"), "true");
	assert.equal(await docs.locator("[data-package-tabs] [role=tabpanel]:visible pre code").textContent(), "pnpm add @oddmash/kowrap");
	await docCopy.click();
	await docs.waitForFunction(() => window.copiedText === "pnpm add @oddmash/kowrap");
	await installTabs.getByRole("tab", { name: "Yarn", exact: true }).click();
	assert.equal(await docs.locator("[data-package-tabs] [role=tabpanel]:visible pre code").textContent(), "yarn add @oddmash/kowrap");
	await docCopy.click();
	await docs.waitForFunction(() => window.copiedText === "yarn add @oddmash/kowrap");
	await docs.waitForFunction(() => document.querySelectorAll(".copy-toast-region .om-toast").length >= 2);
	assert.ok((await docs.locator(".copy-toast-region .om-toast").count()) <= 4, "rapid copy events display a bounded stack");
	await docs.evaluate(async () => {
		const button = document.querySelector("[data-package-tabs] [data-copy-target]");
		for (let i = 0; i < 5; i++) {
			button.click();
			await new Promise(resolve => setTimeout(resolve, 35));
		}
	});
	await docs.waitForFunction(() => document.querySelectorAll(".copy-toast-region .om-toast").length === 4);
	const oldestNotice = docs.locator("[data-copy-notice]").first();
	const oldestId = await oldestNotice.getAttribute("data-copy-notice");
	const previousNewest = Number(await docs.locator("[data-copy-notice]").last().getAttribute("data-copy-notice"));
	const oldestDismiss = oldestNotice.getByRole("button", { name: "알림 닫기" });
	await oldestDismiss.focus();
	await docCopy.evaluate(button => button.click());
	await docs.waitForFunction(previous => document.querySelectorAll(".copy-toast-region .om-toast").length === 4 && [...document.querySelectorAll("[data-copy-notice]")].some(notice => Number(notice.dataset.copyNotice) > previous), previousNewest);
	assert.equal(await docs.locator(`[data-copy-notice="${oldestId}"] button`).evaluate(button => document.activeElement === button), true, "overflow preserves the focused toast");
	await docs.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw Error("unavailable"); } } }));
	await docCopy.click();
	await docs.locator(".copy-toast-region .om-toast").getByRole("alert").getByText("복사 실패", { exact: true }).waitFor();
	assert.equal(await docCopy.textContent(), "복사 실패");
	assert.ok((await docs.locator(".copy-toast-region .om-toast").count()) <= 4);
	await docs.locator(".copy-toast-region .om-toast").filter({ has: docs.getByRole("alert") }).getByRole("button", { name: "알림 닫기" }).click();
	await docs.locator(".copy-toast-region .om-toast").getByRole("alert").waitFor({ state: "hidden" });
	await docs.keyboard.press("Control+k");
	await docs.getByRole("dialog").waitFor();
	await docs.waitForFunction(() => document.activeElement?.id === "docs-search");
	assert.equal(await docs.locator("#docs-search").evaluate((element) => getComputedStyle(element).outlineOffset), "-1px");
	await docs.keyboard.press("Escape");
	await docs.getByRole("dialog").waitFor({ state: "hidden" });
	await docs.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "문서 검색");
	await docs.keyboard.press("Meta+k");
	await docs.getByRole("dialog").waitFor();
	await docs.locator("#docs-search").fill("SSR");
	const search = docs.locator("#docs-search");
	const composingKeyWasHandled = await search.evaluate((element) => !element.dispatchEvent(
		new KeyboardEvent("keydown", { key: "ArrowDown", isComposing: true, bubbles: true, cancelable: true }),
	));
	assert.equal(composingKeyWasHandled, false, "ArrowDown remains available to the IME");
	assert.equal(await search.evaluate((element) => document.activeElement === element), true);
	await docs
		.getByRole("dialog").getByRole("link", { name: /SSR과 하이드레이션/ })
		.first()
		.waitFor();
	await search.press("ArrowDown");
	assert.equal(await docs.locator(".search-dialog-results a").first().evaluate((element) => document.activeElement === element), true);
	await docs.keyboard.press("ArrowUp");
	assert.equal(await search.evaluate((element) => document.activeElement === element), true);
	await docs
		.getByRole("dialog").getByRole("link", { name: /SSR과 하이드레이션/ })
		.first()
		.click();
	await docs.waitForURL("**/docs/ssr/");
	assert.match(await docs.locator("h1").textContent(), /SSR과 하이드레이션/);
	const mobileViewport = { width: 375, height: 812 };
	const mobile = await openPage(mobileViewport);
	await mobile.emulateMedia({ reducedMotion: "reduce" });
	await mobile.goto(`${origin}/`);
	const mobileEditor = mobile.getByRole("textbox", { name: "비교할 문장" });
	assert.equal(await mobileEditor.isVisible(), true);
	assert.ok((await mobileEditor.boundingBox()).y < (await mobile.locator("#native-preview").boundingBox()).y);
	await verifySpecimen(mobile, false);
	await verifyLandingGeometry(mobile);
	if (engine.name() === "chromium") await mobile.screenshot({ path: "test-results/renewal/landing-mobile.png", fullPage: true, animations: "disabled" });
	await mobile.locator(".actual-width").waitFor();
	assert.ok(await mobile.locator(".actual-width").textContent().then((text) => /실제 비교 폭: \d+px/.test(text)));
	await mobile.getByRole("link", { name: "내 문장으로 체험하기" }).click();
	await mobile.locator(".inline-guide-link").click();
	await mobile.waitForURL("**/docs/inline/");
	const inlineCode = await mobile.locator(".doc-code pre").first().evaluate((element) => ({
		left: element.getBoundingClientRect().left,
		right: element.getBoundingClientRect().right,
		viewport: innerWidth,
		overflow: getComputedStyle(element).overflowX,
	}));
	assert.ok(inlineCode.left >= 0 && inlineCode.right <= inlineCode.viewport + 1, "Inline code block fits the mobile viewport");
	assert.equal(inlineCode.overflow, "auto", "Long code lines can scroll inside their own block");
	assert.ok(
		await mobile.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth + 2,
		),
	);
	const reduced = await openPage({ width: 320, height: 812 });
	await reduced.emulateMedia({ reducedMotion: "reduce" });
	await reduced.route("**/*.woff2", (route) => route.abort());
	await reduced.goto(`${origin}/`);
	await verifyLandingGeometry(reduced);
	assert.equal(await reduced.locator(".specimen-text:visible").count(), 2);
	await reduced.getByRole("link", { name: "내 문장으로 체험하기" }).click();
	await reduced.locator("#demo-width").press("Home");
	await reduced.waitForFunction(() => [...document.querySelectorAll(".preview-ruler > span")].every((marker) => {
		const width = marker.closest(".preview-stage").querySelector(".preview-text").getBoundingClientRect().width;
		const style = getComputedStyle(marker);
		return width === 180 && style.transitionProperty === "none" && new DOMMatrixReadOnly(style.transform).m41 === width;
	}));
	assert.ok(await reduced.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), "the narrow landing fits when fonts fail");
	const guides = await readdir(resolve(root, "docs"), { withFileTypes: true });
	const api = await openPage(desktop);
	await api.emulateMedia({ reducedMotion: "reduce" });
	await api.goto(`${origin}/docs/api/#dom`);
	const apiToc = api.getByRole("navigation", { name: "이 문서의 내용" });
	await apiToc.locator('a[href="#dom"][aria-current="location"]').waitFor();
	await api.locator("#react").evaluate((heading) => heading.scrollIntoView());
	await apiToc.locator('a[href="#react"][aria-current="location"]').waitFor();
	assert.equal(await apiToc.locator('[aria-current="location"]').count(), 1);
	const nearEnd = await api.locator("#react").evaluate(async (heading) => {
		await document.fonts.ready;
		const top = scrollY + heading.getBoundingClientRect().top - parseFloat(getComputedStyle(heading).scrollMarginTop);
		return Math.ceil(document.documentElement.scrollHeight - top);
	});
	await api.setViewportSize({ width: desktop.width, height: nearEnd });
	await api.locator("#react").evaluate((heading) => heading.scrollIntoView());
	await api.waitForFunction(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 2);
	await apiToc.locator('a[href="#react"][aria-current="location"]').waitFor();
	for (const width of [390, 800]) {
		const narrowDocs = await openPage({ width, height: 844 });
		await narrowDocs.emulateMedia({ reducedMotion: "reduce" });
		await narrowDocs.goto(`${origin}/docs/api/`);
		const toc = narrowDocs.getByRole("navigation", { name: "이 문서의 내용" });
		const toggle = toc.getByRole("button", { name: /이 문서의 내용/ });
		await toggle.press("Enter");
		await toc.getByRole("link", { name: "DOM", exact: true }).press("Enter");
		await narrowDocs.waitForFunction(() => location.hash === "#dom" && document.activeElement?.id === "dom");
		assert.equal(await toggle.getAttribute("aria-expanded"), "false");
		assert.match(await toggle.textContent(), /DOM/);
		const headerOffset = await narrowDocs.locator("#dom").boundingBox();
		const tocOffset = await toc.boundingBox();
		assert.ok(tocOffset.y <= 1 && tocOffset.y + tocOffset.height < headerOffset.y);
		const apiTable = narrowDocs.getByRole("region", { name: "표", exact: true }).filter({ hasText: "createCanvasMeasure(options" });
		assert.equal(await apiTable.locator("td code").first().evaluate((signature) => getComputedStyle(signature).whiteSpace), "nowrap");
		if (width === 390) {
			assert.equal(await apiTable.evaluate((table) => table.scrollWidth > table.clientWidth), true);
			await apiTable.focus();
			assert.equal(await apiTable.evaluate((table) => document.activeElement === table), true);
		}
	}
	const inlineDocs = await openPage({ width: 320, height: 812 });
	await inlineDocs.addInitScript(() => { window.ResizeObserver = undefined; });
	await inlineDocs.goto(`${origin}/docs/inline/`);
	if (engine.name() === "chromium") await inlineDocs.screenshot({ path: "test-results/renewal/guide-mobile.png", fullPage: true, animations: "disabled" });
	const inlineProse = inlineDocs.locator("#doc-content > p[data-kowrap-prose]").first();
	await inlineProse.locator("br[data-kowrap-break]").first().waitFor({ state: "attached" });
	const [kowrapHeight, cssHeight, sameTypography] = await inlineProse.evaluate(async (paragraph) => {
		await document.fonts.ready;
		const native = paragraph.cloneNode(true);
		native.querySelectorAll("br[data-kowrap-break]").forEach((br) => br.remove());
		native.style.position = "absolute";
		native.style.visibility = "hidden";
		native.style.width = `${paragraph.getBoundingClientRect().width}px`;
		const typography = getComputedStyle(paragraph);
		native.style.font = typography.font;
		native.style.letterSpacing = typography.letterSpacing;
		native.style.wordSpacing = typography.wordSpacing;
		native.style.lineHeight = typography.lineHeight;
		paragraph.after(native);
		const heights = [paragraph.getBoundingClientRect().height, native.getBoundingClientRect().height];
		const sameTypography = getComputedStyle(native).fontSize === typography.fontSize && getComputedStyle(native).lineHeight === typography.lineHeight;
		native.remove();
		return [...heights, sameTypography];
	});
	assert.equal(sameTypography, true, "native comparison uses the same typography");
	assert.ok(kowrapHeight <= cssHeight + 1, "the first measurement does not introduce an extra line");
	const paths = ["", ...guides.filter((entry) => entry.isDirectory()).map((entry) => entry.name + "/")];
	for (const path of paths) {
		const guide = await openPage(mobileViewport);
		const response = await guide.goto(`${origin}/docs/${path}`);
		assert.ok(response.ok(), `Guide loads: ${path}`);
		await guide.locator("#doc-content h1[data-kowrap-prose]").waitFor();
		assert.equal(await guide.locator(".doc-code br[data-kowrap-break], .doc-table br[data-kowrap-break]").count(), 0);
		await guide.evaluate(async () => {
			await document.fonts.ready;
			await new Promise((resolve) => requestAnimationFrame(resolve));
			await new Promise((resolve) => requestAnimationFrame(resolve));
		});
		assert.ok(await guide.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `Guide fits: ${path}`);
	}
	assert.deepEqual(errors, []);
	console.log(
		`${engine.name()}: landing comparisons, standalone CDN example, docs search, navigation and mobile layout passed`,
	);
} finally {
	await browser?.close();
	server.close();
}
