import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
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
	assert.equal(await page.locator("#hero-title").textContent(), "한국어를 읽는 흐름대로");
	assert.ok(await page.locator("#hero-title").evaluate(async (title) => {
		await document.fonts.ready;
		const family = getComputedStyle(title).fontFamily.split(",")[0];
		return [...document.fonts].some((face) => face.family.replaceAll('"', "") === family.replaceAll('"', "") && face.status === "loaded");
	}), "the locally hosted display face loads");
	await page.getByRole("link", { name: "줄바꿈 체험하기" }).click();
	assert.equal(new URL(page.url()).hash, "#playground");
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
	await mobile.goto(`${origin}/`);
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
	await reduced.locator("#demo-width").press("Home");
	await reduced.waitForFunction(() => [...document.querySelectorAll(".preview-ruler > span")].every((marker) => {
		const width = marker.closest(".preview-stage").querySelector(".preview-text").getBoundingClientRect().width;
		const style = getComputedStyle(marker);
		return width === 180 && style.transitionProperty === "none" && new DOMMatrixReadOnly(style.transform).m41 === width;
	}));
	assert.equal(await reduced.locator(".hero-fold").evaluate((mark) => getComputedStyle(mark).animationName), "none");
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
