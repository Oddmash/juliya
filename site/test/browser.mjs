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
	await page.locator('[data-layer="kowrap"] br').first().waitFor({ state: "attached" });
	const ribbon = page.locator(".specimen-ribbon[data-positioned]");
	await ribbon.waitFor();
	const status = page.locator(".specimen [role=status]");
	assert.equal(await status.isVisible(), true);
	assert.match(await status.textContent(), /Kowrap을 눌러/);
	assert.equal(await page.locator(".specimen input[type=range]").count(), 0);
	assert.equal(await page.locator(".specimen-layer:visible").count(), 1);
	const [css, kowrap] = await page.locator(".specimen-layer p").evaluateAll((samples) => samples.map((sample) => {
		const style = getComputedStyle(sample);
		return [sample.textContent, style.width, style.font, style.letterSpacing, style.whiteSpace, style.wordBreak, style.overflowWrap, style.textWrap];
	}));
	assert.deepEqual(css, kowrap, "both modes use the same copy and rendering constraints");
	const nativeWord = page.locator('[data-layer="css"] [data-word="3"]');
	const before = await nativeWord.evaluate((word) => word.getBoundingClientRect().top);
	await ribbon.evaluate((marker) => {
		marker.addEventListener("transitionrun", (event) => {
			if (event.propertyName === "transform") marker.dataset.animated = "true";
		});
	});
	const kowrapMode = page.getByRole("button", { name: "Kowrap", exact: true });
	assert.match(await kowrapMode.getAttribute("class"), /\bom-button--ghost\b/);
	await kowrapMode.press("Enter");
	assert.match(await kowrapMode.getAttribute("class"), /\bom-button--primary\b/);
	const moved = page.locator(".specimen-layer:visible [data-moved]");
	assert.equal(await moved.textContent(), "한곳에서");
	assert.ok(await moved.evaluate((word, top) => word.getBoundingClientRect().top > top, before));
	assert.equal(await kowrapMode.getAttribute("aria-pressed"), "true");
	assert.equal(await kowrapMode.evaluate((button) => document.activeElement === button), true);
	assert.match(await status.textContent(), /한곳에서.*2번째 줄/);
	if (motion) await page.locator(".specimen-ribbon[data-animated]").waitFor();
	else assert.equal(await ribbon.evaluate((marker) => getComputedStyle(marker).transitionProperty), "none");
	await page.waitForFunction(() => {
		const marker = document.querySelector(".specimen-ribbon").getBoundingClientRect();
		const word = document.querySelector(".specimen-layer [data-moved]").getBoundingClientRect();
		const text = document.querySelector('.specimen-layer[aria-hidden="false"] p').getBoundingClientRect();
		return marker.top >= text.bottom && Math.abs((marker.left + marker.right - word.left - word.right) / 2) < 2;
	});
	await page.getByRole("button", { name: "기본 CSS", exact: true }).press("Enter");
	await kowrapMode.press("Enter");
	assert.equal(await kowrapMode.getAttribute("aria-pressed"), "true");
	assert.equal(await page.locator(".specimen-layer:visible [data-moved]").textContent(), "한곳에서");
	assert.equal(await page.locator(".specimen-layer:visible").count(), 1);
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
	const page = await openPage(desktop);
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`);
	assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), "dark");
	assert.equal(await page.locator("#hero-title").textContent(), "한국어 줄바꿈을 자연스럽게");
	assert.ok(await page.locator("#hero-title").evaluate(async (title) => {
		await document.fonts.ready;
		const family = getComputedStyle(title).fontFamily.split(",")[0];
		return [...document.fonts].some((face) => face.family.replaceAll('"', "") === family.replaceAll('"', "") && face.status === "loaded");
	}), "the locally hosted display face loads");
	assert.equal(await page.locator("#editor #demo-text").isVisible(), true);
	await verifySpecimen(page, true);
	await page.getByRole("link", { name: "직접 편집" }).click();
	assert.equal(new URL(page.url()).hash, "#editor");
	assert.equal(await page.locator("#editor").evaluate((editor) => document.activeElement === editor), true);
	await page.getByText("인라인 마크업 예제", { exact: true }).click();
	await page
		.locator("#kowrap-preview br")
		.first()
		.waitFor({ state: "attached" });
	assert.equal(await page.locator("#native-preview br").count(), 0);
	await page.locator("#inline-preview br[data-kowrap-break]").first().waitFor({ state: "attached" });
	assert.equal(await page.locator("#inline-preview strong em").textContent(), "줄바꿈");
	assert.equal(await page.locator("#inline-preview a").getAttribute("href"), "#playground");
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
	await page.getByRole("tab", { name: "HTML", exact: true }).click();
	const landingHtml = await page.getByRole("tabpanel").locator("pre code").textContent();
	const htmlGuide = await openPage(desktop);
	await htmlGuide.goto(`${origin}/docs/dom/`);
	const guideHtml = await htmlGuide.locator("#doc-content pre code").first().textContent();
	assert.equal(guideHtml.trim(), landingHtml.trim(), "The guide and landing publish the same standalone HTML");
	assert.match(landingHtml, /https:\/\/cdn\.jsdelivr\.net\/npm\/@oddmash\/kowrap@\d+\.\d+\.\d+\/dist\/dom\/index\.js\/\+esm/);
	const staticPage = await openPage(desktop);
	const exampleDir = await mkdtemp(resolve(tmpdir(), "kowrap-cdn-"));
	try {
		const exampleFile = resolve(exampleDir, "index.html");
		await writeFile(exampleFile, landingHtml);
		await staticPage.goto(pathToFileURL(exampleFile).href);
		await staticPage.locator("#title > br").first().waitFor({ state: "attached" });
	} finally {
		await rm(exampleDir, { recursive: true, force: true });
	}
	// Separate entry points so a forced page unload cannot abort an active prefetch.
	const docs = await openPage(desktop);
	await docs.goto(`${origin}/docs/`);
	await docs.locator("#doc-content h1[data-kowrap-prose]").waitFor({ state: "attached" });
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
	await mobile.getByRole("link", { name: "직접 편집" }).click();
	await mobile.getByText("인라인 마크업 예제", { exact: true }).click();
	await mobile.locator("#inline-preview br[data-kowrap-break]").first().waitFor({ state: "attached" });
	const inlineCode = await mobile.locator(".inline-example pre").evaluate((element) => ({
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
	assert.equal(await reduced.locator(".specimen-layer:visible").count(), 1);
	await reduced.getByRole("link", { name: "직접 편집" }).click();
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
	const inlineProse = inlineDocs.locator("#doc-content > p[data-kowrap-prose]").first();
	await inlineProse.locator("br[data-kowrap-break]").first().waitFor({ state: "attached" });
	const [kowrapHeight, cssHeight] = await inlineProse.evaluate(async (paragraph) => {
		await document.fonts.ready;
		const native = paragraph.cloneNode(true);
		native.querySelectorAll("br[data-kowrap-break]").forEach((br) => br.remove());
		native.style.position = "absolute";
		native.style.visibility = "hidden";
		native.style.width = `${paragraph.getBoundingClientRect().width}px`;
		paragraph.after(native);
		const heights = [paragraph.getBoundingClientRect().height, native.getBoundingClientRect().height];
		native.remove();
		return heights;
	});
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
