import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const dist = fileURLToPath(new URL("../../dist/", import.meta.url));
const vendorPath = "/vendor/kowrap/dist/";
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
		const isVendor = pathname.startsWith(vendorPath);
		if (
			!isVendor &&
			basePath &&
			pathname !== basePath &&
			!pathname.startsWith(`${basePath}/`)
		)
			throw new Error("Outside base path");
		const directory = resolve(isVendor ? dist : root);
		const relative = pathname.slice(isVendor ? vendorPath.length : basePath.length).replace(/^\/+/, "");
		let path = resolve(directory, relative);
		if (path !== directory && !path.startsWith(`${directory}${sep}`))
			throw new Error("Outside served directory");
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
	assert.match(await page.locator(".specimen [role=status]").textContent(), /2번째 줄/);
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
	const width = page.locator("#specimen-width");
	await width.press("Home");
	await width.press("ArrowRight");
	assert.equal(await width.inputValue(), "8.25");
	assert.equal(await page.locator(".specimen [data-moved]").count(), 0);
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
	assert.equal(await page.locator("#editor").getAttribute("open"), null);
	await verifySpecimen(page, true);
	await page.getByRole("link", { name: "직접 편집" }).click();
	assert.equal(new URL(page.url()).hash, "#editor");
	assert.equal(await page.locator("#editor").getAttribute("open"), "");
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
	const staticPage = await openPage(desktop);
	const exampleUrl = `${origin}/html-example/`;
	for (const html of [landingHtml, guideHtml]) {
		await staticPage.route(exampleUrl, (route) => route.fulfill({
			contentType: "text/html; charset=utf-8",
			body: `<!doctype html><html lang="ko"><meta charset="utf-8">${html}</html>`,
		}), { times: 1 });
		await staticPage.goto(exampleUrl);
		await staticPage.locator("#title > br").first().waitFor({ state: "attached" });
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
	await reduced.locator("#specimen-width").press("Home");
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
	const paths = ["", ...guides.filter((entry) => entry.isDirectory()).map((entry) => entry.name + "/")];
	for (const path of paths) {
		const guide = await openPage(mobileViewport);
		const response = await guide.goto(`${origin}/docs/${path}`);
		assert.ok(response.ok(), `Guide loads: ${path}`);
		await guide.locator("#doc-content h1[data-kowrap-prose]").waitFor();
		await guide.evaluate(async () => {
			await document.fonts.ready;
			await new Promise((resolve) => requestAnimationFrame(resolve));
			await new Promise((resolve) => requestAnimationFrame(resolve));
		});
		assert.ok(await guide.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `Guide fits: ${path}`);
	}
	assert.deepEqual(errors, []);
	console.log(
		`${engine.name()}: landing comparisons, code synchronization, docs search, navigation and mobile layout passed`,
	);
} finally {
	await browser?.close();
	server.close();
}
