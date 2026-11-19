import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
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
	const page = await browser.newPage({
		viewport: { width: 1280, height: 900 },
	});
	const errors = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto(`${origin}/`);
	assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), "dark");
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
	await page.goto(`${origin}/docs/`);
	await page.locator("#doc-content h1[data-kowrap-prose]").waitFor({ state: "attached" });
	await page.keyboard.press("Control+k");
	await page.getByRole("dialog").waitFor();
	await page.waitForFunction(() => document.activeElement?.id === "docs-search");
	assert.equal(await page.locator("#docs-search").evaluate((element) => getComputedStyle(element).outlineOffset), "-1px");
	await page.keyboard.press("Escape");
	await page.getByRole("dialog").waitFor({ state: "hidden" });
	await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "문서 검색");
	await page.keyboard.press("Meta+k");
	await page.getByRole("dialog").waitFor();
	await page.locator("#docs-search").fill("SSR");
	const search = page.locator("#docs-search");
	const composingKeyWasHandled = await search.evaluate((element) => !element.dispatchEvent(
		new KeyboardEvent("keydown", { key: "ArrowDown", isComposing: true, bubbles: true, cancelable: true }),
	));
	assert.equal(composingKeyWasHandled, false, "ArrowDown remains available to the IME");
	assert.equal(await search.evaluate((element) => document.activeElement === element), true);
	await page
		.getByRole("dialog").getByRole("link", { name: /SSR과 하이드레이션/ })
		.first()
		.waitFor();
	await search.press("ArrowDown");
	assert.equal(await page.locator(".search-dialog-results a").first().evaluate((element) => document.activeElement === element), true);
	await page.keyboard.press("ArrowUp");
	assert.equal(await search.evaluate((element) => document.activeElement === element), true);
	await page
		.getByRole("dialog").getByRole("link", { name: /SSR과 하이드레이션/ })
		.first()
		.click();
	await page.waitForURL("**/docs/ssr/");
	assert.match(await page.locator("h1").textContent(), /SSR과 하이드레이션/);
	// Keep the docs page open while checking a separate mobile navigation.
	const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
	mobile.on("pageerror", (error) => errors.push(error.message));
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
	assert.deepEqual(errors, []);
	console.log(
		`${engine.name()}: landing comparisons, code synchronization, docs search, navigation and mobile layout passed`,
	);
} finally {
	await browser?.close();
	server.close();
}
