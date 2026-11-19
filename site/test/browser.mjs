import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

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
	browser = await chromium.launch();
	const page = await browser.newPage({
		viewport: { width: 1280, height: 900 },
	});
	const errors = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto(`${origin}/`);
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
		(await page.locator("#framework-panel").textContent()).includes(
			"kowrapDirective",
		),
	);
	await page.goto(`${origin}/docs/`);
	await page.locator("#docs-search").fill("SSR");
	await page
		.getByRole("link", { name: "SSR과 하이드레이션", exact: true })
		.first()
		.waitFor();
	await page
		.getByRole("link", { name: "SSR과 하이드레이션", exact: true })
		.first()
		.click();
	await page.waitForURL("**/docs/ssr/");
	assert.match(await page.locator("h1").textContent(), /SSR과 하이드레이션/);
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(`${origin}/`);
	await page.locator("#inline-preview br[data-kowrap-break]").first().waitFor({ state: "attached" });
	const inlineCode = await page.locator(".inline-example pre").evaluate((element) => ({
		left: element.getBoundingClientRect().left,
		right: element.getBoundingClientRect().right,
		viewport: innerWidth,
		overflow: getComputedStyle(element).overflowX,
	}));
	assert.ok(inlineCode.left >= 0 && inlineCode.right <= inlineCode.viewport + 1, "Inline code block fits the mobile viewport");
	assert.equal(inlineCode.overflow, "auto", "Long code lines can scroll inside their own block");
	assert.ok(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth + 2,
		),
	);
	assert.deepEqual(errors, []);
	console.log(
		"Landing comparisons, code synchronization, docs search, navigation and mobile layout passed",
	);
} finally {
	await browser?.close();
	server.close();
}
