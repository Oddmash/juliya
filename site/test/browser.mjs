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
	const panels = page.locator(".specimen-panels");
	await page.locator(".specimen-applied .specimen-text br").first().waitFor({ state: "attached" });
	assert.equal(await page.locator(".specimen-text:visible").count(), 1);
	assert.equal(await page.locator(".specimen-examples").count(), 0);
	assert.equal(await page.locator(".specimen-native").getAttribute("aria-hidden"), "true");
	const compare = async () => {
		const [css, kowrap] = await page.locator(".specimen-text").evaluateAll(samples => samples.map(sample => {
			const style = getComputedStyle(sample);
			return [sample.textContent, style.width, style.font, style.letterSpacing, style.whiteSpace, style.wordBreak, style.overflowWrap, style.textWrap];
		}));
		assert.deepEqual(css, kowrap);
		assert.ok(await panels.evaluate(panel => {
			const bounds = panel.getBoundingClientRect();
			const measure = panel.querySelector(".specimen-ruler > span").getBoundingClientRect();
			const sample = panel.querySelector(".specimen-applied .specimen-text").getBoundingClientRect();
			return bounds.left >= 0 && bounds.right <= innerWidth + 1 && Math.abs(measure.width - sample.width) <= 1;
		}));
	};
	await compare();
	assert.ok(await panels.evaluate(panel => {
		const stage = panel.querySelector(".specimen-stage").getBoundingClientRect();
		const ruler = panel.querySelector(".specimen-ruler").getBoundingClientRect();
		const layout = panel.querySelector(".specimen-layout").getBoundingClientRect();
		return Math.abs((ruler.top + layout.bottom) / 2 - (stage.top + stage.bottom) / 2) <= 12;
	}), "the ruler and text are centered in their reserved stage");
	if (motion) {
		await panels.scrollIntoViewIfNeeded();
		const first = await panels.getAttribute("data-example");
		const firstText = await page.locator(".specimen-applied .specimen-text").textContent();
		await panels.evaluate((panel, expectedText) => {
			const sample = panel.querySelector(".specimen-applied .specimen-text");
			const breaksOf = () => {
				let offset = 0;
				const breaks = [];
				for (const node of sample.childNodes) {
					if (node instanceof HTMLBRElement) breaks.push(offset);
					else offset += node.textContent.length;
				}
				return breaks.join(",");
			};
			const firstBounds = sample.getBoundingClientRect();
			const firstRows = Object.fromEntries([...sample.querySelectorAll("[data-word]")].map(word => [word.dataset.word, word.getBoundingClientRect().top - firstBounds.top]));
			const firstBreaks = breaksOf();
			const firstIndex = panel.dataset.example;
			const hero = panel.closest(".landing-intro");
			const copy = hero.querySelector(".hero-copy");
			const install = document.querySelector("#install");
			const layout = () => [copy.offsetLeft, copy.offsetTop, copy.offsetWidth, copy.offsetHeight, hero.offsetHeight, install.offsetTop];
			const initialLayout = layout();
			const observation = window.specimenObservation = {
				firstWidth: firstBounds.width,
				firstRows,
				firstBreaks,
				viewport: [innerWidth, innerHeight],
				steps: {},
				phases: [],
				rotating: false,
				textPreserved: true,
				partialOpacity: false,
				maxRulerDifference: 0,
				maxLayoutShift: 0,
				maxRows: 0,
				maxHighlights: 0,
				allWordsHighlighted: false,
				done: false,
				motionAtReplacement: false,
				motionWhileLeaving: false,
			};
			const observe = () => {
				observation.maxLayoutShift = Math.max(observation.maxLayoutShift, ...layout().map((value, i) => Math.abs(value - initialLayout[i])));
				const moving = [...panel.querySelectorAll(".specimen-layout, .specimen-ruler, .specimen-word-visual")].some(element => element.getAnimations().some(animation => animation.playState === "running" || animation.pending));
				if (panel.dataset.example !== firstIndex) {
					observation.motionAtReplacement = moving;
					observation.done = true;
					return;
				}
				const phase = panel.dataset.phase;
				if (phase === "leaving") observation.motionWhileLeaving ||= moving;
				const step = panel.dataset.widthStep;
				observation.rotating ||= panel.closest(".specimen").dataset.rotating === "true";
				const phaseKey = `${step}:${phase}`;
				if (!observation.phases.includes(phaseKey)) observation.phases.push(phaseKey);
				const bounds = sample.getBoundingClientRect();
				observation.maxRows = Math.max(observation.maxRows, Math.round(bounds.height / parseFloat(getComputedStyle(sample).lineHeight)));
				const summary = observation.steps[step] ??= { min: bounds.width, max: bounds.width, rowChanges: false, breakChanges: false, verticalMotion: false, rows: {}, breaks: [], widths: [], frames: 0 };
				summary.min = Math.min(summary.min, bounds.width);
				summary.max = Math.max(summary.max, bounds.width);
				summary.frames++;
				const roundedWidth = Math.round(bounds.width);
				if (!summary.widths.includes(roundedWidth)) summary.widths.push(roundedWidth);
				const breaks = breaksOf();
				summary.breakChanges ||= breaks !== firstBreaks;
				if (!summary.breaks.includes(breaks)) summary.breaks.push(breaks);
				observation.textPreserved &&= sample.textContent === expectedText;
				const words = [...sample.querySelectorAll("[data-word]")];
				const highlights = words.filter(word => getComputedStyle(word.firstElementChild).textDecorationLine.includes("underline"));
				observation.maxHighlights = Math.max(observation.maxHighlights, highlights.length);
				observation.allWordsHighlighted ||= words.length > 1 && highlights.length === words.length;
				for (const word of words) {
					const key = word.dataset.word;
					const row = word.getBoundingClientRect().top - bounds.top;
					summary.rows[key] = Math.round(row);
					if (key in firstRows && Math.abs(row - firstRows[key]) > 8) summary.rowChanges = true;
					const transform = getComputedStyle(word.firstElementChild).transform;
					if (transform !== "none" && Math.abs(new DOMMatrixReadOnly(transform).m42) > 2) summary.verticalMotion = true;
				}
				const rulerWidth = panel.querySelector(".specimen-ruler > span").getBoundingClientRect().width;
				observation.maxRulerDifference = Math.max(observation.maxRulerDifference, Math.abs(bounds.width - rulerWidth));
				const opacity = Number(getComputedStyle(panel.querySelector(".specimen-applied")).opacity);
				if (phase === "leaving" && opacity > .02 && opacity < .98) observation.partialOpacity = true;
				requestAnimationFrame(observe);
			};
			requestAnimationFrame(observe);
		}, firstText);
		await page.emulateMedia({ reducedMotion: "no-preference" });
		assert.equal(await page.locator(".specimen-stage").evaluate(element => getComputedStyle(element).animationName), "none", "the server-rendered hero does not fade from transparent");
		try {
			await page.waitForFunction(() => window.specimenObservation.done, undefined, { timeout: 22000 });
			const observation = await page.evaluate(() => window.specimenObservation);
			const { firstWidth, steps, partialOpacity, textPreserved } = observation;
			assert.ok(observation.rotating, "the specimen entered its rotating state");
			assert.ok(steps[1] && steps[2], "both width stages were displayed");
			assert.ok(steps[1].min < firstWidth - 8, "the actual text container shrank");
			assert.ok(steps[2].max > steps[1].min + 8, "the actual text container expanded again");
			assert.ok(steps[1].widths.length > 2 && steps[2].widths.length > 2, "both width changes passed through intermediate rendered sizes");
			assert.ok(steps[1].rowChanges || steps[2].rowChanges, "the same text moved between actual rendered rows during the width cycle");
			assert.ok(steps[1].breakChanges || steps[2].breakChanges, "the wrapping engine recomputed line-break boundaries at the new width");
			assert.ok(steps[1].verticalMotion || steps[2].verticalMotion, "the moving words had a measured in-progress vertical transform during the width cycle");
			assert.ok(partialOpacity, "the old specimen faded through intermediate opacity before replacement");
			assert.equal(observation.motionWhileLeaving, false, "width and word motion settle before fade-out");
			assert.equal(observation.motionAtReplacement, false, "new text is never introduced during width or word motion");
			assert.ok(textPreserved, "the same text was preserved throughout its width cycle");
			assert.ok(observation.maxRulerDifference <= 1, "the ruler tracked the text width throughout the animation");
			assert.ok(!observation.allWordsHighlighted && observation.maxHighlights <= observation.maxRows, "only changed line starts may be highlighted");
			assert.ok(observation.maxLayoutShift <= 1, "text reflow does not shift the brand, calls to action or following section");
			assert.ok(observation.maxRows >= 3 && observation.maxRows <= 5, "the longer specimen fills the stage without exceeding its five desktop lines");
		} catch (error) {
			console.error("Specimen motion observation:", JSON.stringify(await page.evaluate(() => window.specimenObservation)));
			throw error;
		}
		assert.notEqual(await panels.getAttribute("data-example"), first);
		assert.notEqual(await page.locator(".specimen-applied .specimen-text").textContent(), firstText, "a different example replaces the first");
		assert.equal(await panels.getAttribute("lang"), "ko");
		await compare();
		await page.getByRole("button", { name: "시연 일시정지" }).press("Enter");
		assert.ok(await panels.evaluate(panel => Math.abs(panel.querySelector(".specimen-pause").getBoundingClientRect().right - panel.getBoundingClientRect().right) <= 1), "pause control is aligned to the right edge");
		await page.waitForFunction(() => document.querySelector(".specimen").dataset.rotating === "false");
		const current = await panels.getAttribute("data-example");
		const pausedWidth = await page.locator(".specimen-applied .specimen-text").evaluate(sample => sample.getBoundingClientRect().width);
		await page.waitForTimeout(14000);
		assert.equal(await panels.getAttribute("data-example"), current);
		assert.ok(Math.abs(await page.locator(".specimen-applied .specimen-text").evaluate(sample => sample.getBoundingClientRect().width) - pausedWidth) <= 1, "paused width remains unchanged (allowing subpixel rounding)");
		assert.equal(await panels.getAttribute("data-phase"), "kowrap");
		await page.getByRole("button", { name: "시연 재생" }).press("Enter");
		assert.equal(await page.locator(".specimen").getAttribute("data-rotating"), "true");
		await page.waitForTimeout(300);
		const scroll = await panels.evaluate(async panel => {
			const stage = panel.querySelector(".specimen-stage");
			const sample = panel.querySelector(".specimen-applied .specimen-text");
			const documentTop = element => element.getBoundingClientRect().top + scrollY;
			const before = [documentTop(stage), documentTop(sample), scrollY];
			window.scrollBy({ top: 64, behavior: "instant" });
			await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
			const after = [documentTop(stage), documentTop(sample), scrollY];
			return { before, after, transforms: [...sample.querySelectorAll(".specimen-word-visual")].some(word => getComputedStyle(word).transform !== "none") };
		});
		assert.ok(scroll.after[2] > scroll.before[2], "the page actually scrolled");
		assert.ok(Math.abs(scroll.after[0] - scroll.before[0]) <= 1 && Math.abs(scroll.after[1] - scroll.before[1]) <= 1, "the specimen stays anchored on document scroll");
		assert.equal(scroll.transforms, false, "scrolling alone does not trigger word motion");
		await page.locator("#install").scrollIntoViewIfNeeded();
		await page.evaluate(() => window.scrollTo({ top: document.querySelector("#editor").offsetTop, behavior: "instant" }));
		await page.waitForFunction(() => document.querySelector(".specimen").dataset.rotating === "false");
		const offscreenIndex = await panels.getAttribute("data-example");
		const offscreenWidth = await page.locator(".specimen-applied .specimen-text").evaluate(sample => sample.getBoundingClientRect().width);
		await page.waitForTimeout(4200);
		assert.equal(await panels.getAttribute("data-example"), offscreenIndex);
		assert.ok(Math.abs(await page.locator(".specimen-applied .specimen-text").evaluate(sample => sample.getBoundingClientRect().width) - offscreenWidth) <= 1, "offscreen width remains unchanged");
		assert.equal(await page.locator(".specimen-applied [data-reflow]").count(), 0);
		await panels.scrollIntoViewIfNeeded();
		await page.waitForFunction(() => document.querySelector(".specimen").dataset.rotating === "true");
	} else {
		assert.equal(await panels.getAttribute("data-phase"), "kowrap");
		assert.equal(await page.locator(".specimen-pause").count(), 0);
		assert.ok(await panels.evaluate(panel => panel.getAnimations({ subtree: true }).length === 0));
	}
};
const verifyBrand = async (page, language) => {
	const documentLanguage = language === "zh" ? "zh-Hans" : language;
	await page.waitForFunction(lang => document.documentElement.lang === lang, documentLanguage);
	const skipLabel = {
		ko: "본문 바로가기",
		en: "Skip to main content",
		ja: "本文へ移動",
		zh: "跳到主要内容",
	}[language];
	assert.equal(await page.locator(".skip-link").textContent(), skipLabel);
	const name = language === "ko" ? "줄이야" : "Juliya";
	const href = `${basePath}${language === "ko" ? "" : `/${language}`}/`;
	const label = { ko: "줄이야 홈", en: "Juliya home", ja: "Juliya ホーム", zh: "Juliya 首页" }[language];
	for (const selector of [".header .brand", ".footer .brand"]) {
		const brand = page.locator(selector);
		await brand.locator(".brand-name").filter({ hasText: name }).waitFor();
		assert.equal(await brand.locator(".brand-name").textContent(), name);
		assert.equal(await brand.getAttribute("href"), href);
		assert.equal(await brand.getAttribute("aria-label"), label);
	}
	assert.match(await page.locator(".header .brand .version").textContent(), /^v\d+\.\d+\.\d+/);
};

const verifyLandingGeometry = async (page) => {
	assert.ok(await page.locator(".landing-intro").evaluate(hero => {
		const copy = hero.querySelector(".hero-copy").getBoundingClientRect();
		const specimen = hero.querySelector(".specimen").getBoundingClientRect();
		return innerWidth > 900 ? copy.right <= specimen.left + 1 : copy.bottom <= specimen.top + 1;
	}), "brand copy is left of the demo on desktop and above it on smaller screens");
	assert.equal(await page.locator(".specimen-examples, .specimen-progress, .landing-proof-note").count(), 0);
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
	const refresh = await openPage(desktop);
	await refresh.emulateMedia({ reducedMotion: "no-preference" });
	await refresh.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
	const firstPaint = await refresh.locator(".specimen-stage").evaluate(element => ({ opacity: getComputedStyle(element).opacity, animation: getComputedStyle(element).animationName }));
	assert.deepEqual(firstPaint, { opacity: "1", animation: "none" });
	await refresh.reload({ waitUntil: "domcontentloaded" });
	assert.deepEqual(await refresh.locator(".specimen-stage").evaluate(element => ({ opacity: getComputedStyle(element).opacity, animation: getComputedStyle(element).animationName })), firstPaint, "refresh keeps the hero visible without an entrance animation");
	await refresh.close();
	const comparison = await openPage({ width: 1280, height: 1400 });
	await comparison.goto(`${origin}/comparison/`);
	assert.equal(await comparison.locator(".example-case").count(), 3);
	assert.equal(await comparison.locator(".example-notification").getAttribute("lang"), "ja");
	assert.equal(await comparison.locator(".example-developer").getAttribute("lang"), "en");
	assert.equal(await comparison.locator(".benchmark-details").count(), 0);
	assert.equal(await comparison.locator(".example-description[lang='ko']").count(), 4);
	await comparison.locator(".examples-intro .example-description br").first().waitFor({ state: "attached" });
	assert.ok(await comparison.locator(".footer").evaluate(footer => Math.abs(footer.getBoundingClientRect().bottom - innerHeight) <= 1), "footer is anchored to the viewport on a short page");
	await comparison.setViewportSize({ width: 320, height: 812 });
	await comparison.locator(".example-case .example-description br").first().waitFor({ state: "attached" });
	assert.ok(await comparison.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
	assert.ok(await comparison.locator(".footer").evaluate(footer => footer.getBoundingClientRect().top >= document.querySelector("#main").getBoundingClientRect().bottom - 1), "footer stays after long mobile content");
	await comparison.close();
	for (const [language, label] of [["en", "Search docs"], ["ja", "検索"], ["zh", "搜索文档"]]) {
		const localized = await openPage(desktop);
		await localized.emulateMedia({ reducedMotion: "reduce" });
		await localized.goto(`${origin}/${language}/`);
		await localized.getByRole("button", { name: label, exact: true }).waitFor();
		assert.equal(await localized.locator("#hero-title").textContent(), "Juliya");
		await verifyBrand(localized, language);
		await verifyLandingGeometry(localized);
		const verifyLanguage = async () => {
			assert.equal(await localized.locator(".specimen-panels").getAttribute("lang"), language === "zh" ? "zh-Hans" : language);
			const sample = await localized.locator(".specimen-applied .specimen-text").textContent();
			assert.match(sample, { en: /[A-Za-z]/u, ja: /\p{Script=Hiragana}/u, zh: /\p{Script=Han}/u }[language]);
			assert.doesNotMatch(sample, /\p{Script=Hangul}/u);
			if (language === "en") assert.doesNotMatch(sample, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u);
			if (language === "zh") assert.doesNotMatch(sample, /[\p{Script=Hiragana}\p{Script=Katakana}]/u);
			return sample;
		};
		const sample = await verifyLanguage();
		const snippet = await localized.getByRole("tabpanel").locator("pre code").textContent();
		assert.match(snippet, new RegExp(`<JuliyaProvider locale="${language === "zh" ? "zh-Hans" : language}">`));
		assert.match(snippet, /<JuliyaText as="h1">/);
		assert.doesNotMatch(snippet, /<JuliyaText[^>]*locale=/);
		const initialExample = await localized.locator(".specimen-panels").getAttribute("data-example");
		await localized.emulateMedia({ reducedMotion: "no-preference" });
		await localized.waitForFunction(index => document.querySelector(".specimen-panels").dataset.example !== index, initialExample);
		assert.notEqual(await verifyLanguage(), sample, "rotating examples stay in the selected language");
		await localized.emulateMedia({ reducedMotion: "reduce" });
		await localized.waitForLoadState("networkidle");
		await localized.evaluate(() => { window.sharedCtaNavigation = true; });
		await localized.locator(".hero-actions .button-primary").click();
		await localized.waitForURL(`${origin}/${language}/docs/`);
		await verifyBrand(localized, language);
		assert.equal(await localized.evaluate(() => window.sharedCtaNavigation), true, "shared CTA preserves client navigation");
		await localized.locator(`.docs-sidebar a[href="${basePath}/${language}/docs/core/"]`).click();
		await localized.waitForURL(`${origin}/${language}/docs/core/`);
		assert.equal(await localized.evaluate(() => window.sharedCtaNavigation), true, "shared documentation links preserve client navigation");
		assert.ok((await localized.locator(".docs-content code").textContent()).includes(`@oddmash/juliya/${language}`));
		await localized.waitForLoadState("networkidle");
		await localized.locator(".footer .brand").click();
		await localized.waitForURL(`${origin}/${language}/`);
		await verifyBrand(localized, language);
		assert.equal(await localized.evaluate(() => window.sharedCtaNavigation), true, "localized brand preserves client navigation");
		await localized.close();
	}
	const page = await openPage(desktop);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(`${origin}/`);
	assert.ok(await page.getByRole("button", { name: "문서 검색" }).isVisible());
	assert.equal(await page.locator(".specimen-mode").count(), 0);
	assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), "dark");
	assert.equal(await page.locator("#hero-title").textContent(), "줄이야 다국어 줄바꿈 라이브러리");
	assert.equal(await page.locator(".specimen-panels").getAttribute("lang"), "ko");
	assert.equal(await page.locator(".landing-kicker").count(), 0);
	assert.ok(await page.locator(".landing-intro").evaluate(hero => hero.querySelector(".hero-copy").compareDocumentPosition(hero.querySelector(".specimen")) & Node.DOCUMENT_POSITION_FOLLOWING), "brand and calls to action precede the live example");
	assert.ok(await page.locator(".specimen-native.specimen-text").evaluate(async (title) => {
		await document.fonts.ready;
		const family = getComputedStyle(title).fontFamily.split(",")[0];
		return [...document.fonts].some((face) => face.family.replaceAll('"', "") === family.replaceAll('"', "") && face.status === "loaded");
	}), "the locally hosted display face loads");
	assert.equal(await page.locator("#editor #demo-text").isVisible(), true);
	const github = page.locator(".nav").getByRole("link", { name: "GitHub", exact: true });
	const npm = page.locator(".nav").getByRole("link", { name: "npm", exact: true });
	assert.ok((await github.getAttribute("class")).includes("om-platform-link"));
	await github.hover();
	assert.equal(await github.locator("svg").evaluate(svg => getComputedStyle(svg).animationName), "none");
	await page.mouse.move(0, 0);
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await github.hover();
	assert.equal(await github.locator("svg").evaluate(svg => getComputedStyle(svg).animationName), "om-platform-pulse");
	await npm.hover();
	assert.equal(await npm.locator("svg").evaluate(svg => getComputedStyle(svg).animationName), "om-platform-pulse");
	await page.mouse.move(0, 0);
	await page.emulateMedia({ reducedMotion: "reduce" });
	const localeTrigger = page.locator(".nav .language-select");
	assert.equal(await localeTrigger.getAttribute("role"), "combobox");
	await localeTrigger.press("Enter");
	await page.getByRole("option", { name: "English", exact: true }).click();
	await page.waitForURL(`${origin}/en/`);
	await localeTrigger.filter({ hasText: "English" }).waitFor();
	await verifyBrand(page, "en");
	for (const [language, name] of [["ja", "日本語"], ["zh", "简体中文"]]) {
		await localeTrigger.click();
		await page.getByRole("option", { name, exact: true }).click();
		await page.waitForURL(`${origin}/${language}/`);
		await verifyBrand(page, language);
	}
	await localeTrigger.click();
	await page.getByRole("option", { name: "한국어", exact: true }).click();
	await page.waitForURL(`${origin}/`);
	await localeTrigger.filter({ hasText: "한국어" }).waitFor();
	await verifyBrand(page, "ko");
	const demoLocale = page.locator("#demo-locale");
	assert.equal(await demoLocale.getAttribute("role"), "combobox");
	await demoLocale.press("Enter");
	await page.getByRole("option", { name: "日本語", exact: true }).click();
	await demoLocale.filter({ hasText: "日本語" }).waitFor();
	assert.match(await page.locator("#demo-text").inputValue(), /\p{Script=Hiragana}/u);
	await demoLocale.click();
	await page.getByRole("option", { name: "한국어", exact: true }).click();
	await demoLocale.filter({ hasText: "한국어" }).waitFor();
	await verifySpecimen(page, true);
	const reactSnippet = await page.getByRole("tabpanel").locator("pre code").textContent();
	assert.match(reactSnippet, /<JuliyaProvider locale="ko">/);
	assert.match(reactSnippet, /<JuliyaText as="h1">/);
	assert.doesNotMatch(reactSnippet, /<JuliyaText[^>]*locale=/);
	assert.equal(await page.getByRole("navigation", { name: "주 메뉴" }).getByRole("link", { name: "체험하기", exact: true }).count(), 0);
	assert.ok(await page.locator(".landing-intro").evaluate(hero => hero.getBoundingClientRect().height >= innerHeight - 80), "desktop hero fills the first view");
	await verifyLandingGeometry(page);
	assert.equal(await page.locator(".capability-grid article").count(), 3);
	assert.equal(await page.locator(".landing a[href$='/comparison/']").count(), 0);
	assert.equal(await page.locator(".case-comparison").count(), 0);
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
	const fontRange = page.locator("#font-size");
	for (const slider of [range, fontRange]) {
		assert.equal(await slider.getAttribute("type"), "range");
		assert.match(await slider.getAttribute("class"), /\bom-slider\b/);
		assert.equal(await slider.evaluate((element) => element.labels?.length), 1);
	}
	await fontRange.press("End");
	await page.waitForFunction(() => [...document.querySelectorAll("#native-preview, #kowrap-preview")].every((element) => getComputedStyle(element).fontSize === "32px"));
	await fontRange.press("Home");
	await page.waitForFunction(() => [...document.querySelectorAll("#native-preview, #kowrap-preview")].every((element) => getComputedStyle(element).fontSize === "16px"));
	for (let step = 0; step < 8; step += 1) await fontRange.press("ArrowRight");
	await page.waitForFunction(() => [...document.querySelectorAll("#native-preview, #kowrap-preview")].every((element) => getComputedStyle(element).fontSize === "24px"));
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
	assert.match(landingHtml, /https:\/\/cdn\.jsdelivr\.net\/npm\/@oddmash\/juliya@\d+\.\d+\.\d+\/dist\/dom\/index\.js\/\+esm/);
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
	assert.equal(await docs.locator("[data-package-tabs] [role=tabpanel]:visible pre code").textContent(), "npm install @oddmash/juliya");
	await docCopy.click();
	await docs.locator(".copy-toast-region .om-toast").getByRole("status").getByText("복사 완료", { exact: true }).waitFor();
	assert.equal(await docs.evaluate(() => window.copiedText), "npm install @oddmash/juliya");
	await installTabs.getByRole("tab", { name: "npm", exact: true }).press("ArrowRight");
	assert.equal(await installTabs.getByRole("tab", { name: "pnpm", exact: true }).getAttribute("aria-selected"), "true");
	assert.equal(await docs.locator("[data-package-tabs] [role=tabpanel]:visible pre code").textContent(), "pnpm add @oddmash/juliya");
	await docCopy.click();
	await docs.waitForFunction(() => window.copiedText === "pnpm add @oddmash/juliya");
	await installTabs.getByRole("tab", { name: "Yarn", exact: true }).click();
	assert.equal(await docs.locator("[data-package-tabs] [role=tabpanel]:visible pre code").textContent(), "yarn add @oddmash/juliya");
	await docCopy.click();
	await docs.waitForFunction(() => window.copiedText === "yarn add @oddmash/juliya");
	await docs.waitForFunction(() => document.querySelectorAll(".copy-toast-region .om-toast").length >= 2);
	assert.ok((await docs.locator(".copy-toast-region .om-toast").count()) <= 4, "rapid copy events display a bounded stack");
	const stackOverflow = await docs.evaluate(async () => {
		const button = document.querySelector("[data-package-tabs] [data-copy-target]");
		const region = document.querySelector(".copy-toast-region");
		let maximumOverflow = 0;
		const sample = () => {
			const style = getComputedStyle(region);
			if (style.overflowY === "auto") maximumOverflow = Math.max(maximumOverflow, region.scrollHeight - region.clientHeight);
			if (style.overflowX === "auto") maximumOverflow = Math.max(maximumOverflow, region.scrollWidth - region.clientWidth);
		};
		for (let i = 0; i < 5; i++) {
			button.click();
			await new Promise(resolve => requestAnimationFrame(() => { sample(); requestAnimationFrame(() => { sample(); resolve(); }); }));
		}
		const start = performance.now();
		while (performance.now() - start < 220) {
			await new Promise(resolve => requestAnimationFrame(() => { sample(); resolve(); }));
		}
		return maximumOverflow;
	});
	assert.ok(stackOverflow <= 0, "stacked toast entrance never creates an incidental scrollbar");
	await docs.waitForFunction(() => document.querySelectorAll(".copy-toast-region .om-toast").length === 4);
	const oldestNotice = docs.locator('[data-toast-id][data-state="open"]').first();
	const oldestId = await oldestNotice.getAttribute("data-toast-id");
	const previousNewest = Number(await docs.locator('[data-toast-id][data-state="open"]').last().getAttribute("data-toast-id"));
	const oldestDismiss = oldestNotice.getByRole("button", { name: "알림 닫기" });
	await oldestDismiss.focus();
	await docCopy.evaluate(button => button.click());
	assert.equal(await docs.locator('[data-toast-id][data-state="open"]').count(), 4, "new notices queue until there is space");
	assert.equal(await docs.locator(`[data-toast-id="${oldestId}"] button`).evaluate(button => document.activeElement === button), true, "queue preserves the focused toast");
	await oldestDismiss.press("Enter");
	await docs.waitForFunction(previous => [...document.querySelectorAll('[data-toast-id][data-state="open"]')].some(notice => Number(notice.dataset.toastId) > previous), previousNewest);
	await docCopy.focus();
	await docs.mouse.move(0, 0);
	await docs.waitForFunction(() => document.querySelectorAll(".copy-toast-region .om-toast").length === 0);
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
	for (const language of ["", "en", "ja", "zh"]) {
		const compact = await openPage({ width: 320, height: 812 });
		await compact.emulateMedia({ reducedMotion: "reduce" });
		await compact.goto(language ? `${origin}/${language}/` : `${origin}/`);
		for (const width of [320, 375, 430]) {
			await compact.setViewportSize({ width, height: 812 });
			await compact.evaluate(() => document.fonts.ready);
			assert.ok(await compact.locator(".landing").evaluate(landing => [...landing.querySelectorAll(".hero-description, h2")].every(element => element.scrollWidth <= element.clientWidth + 1)), "localized hero and section copy fit the mobile viewport");
			assert.ok(await compact.locator(".landing-intro").evaluate(hero => {
				const specimen = hero.querySelector(".specimen").getBoundingClientRect();
				const cue = hero.querySelector(".hero-scroll").getBoundingClientRect();
				return cue.top >= specimen.bottom - 1 && cue.top - specimen.bottom <= 16;
			}), "mobile scroll cue follows the reserved specimen without extra viewport space");
			if (engine.name() === "chromium") await compact.screenshot({ path: `test-results/renewal/landing-${language || "ko"}-${width}.png`, animations: "disabled" });
		}
		await compact.close();
	}
	if (engine.name() === "chromium") {
		const captureMobileScene = (previous) => {
			const panel = document.querySelector(".specimen-panels");
			const index = panel?.dataset.example;
			if (!index || previous.includes(index) || panel.dataset.widthStep !== "1" || panel.dataset.phase !== "kowrap") return false;
			const hero = panel.closest(".landing-intro");
			const stage = panel.querySelector(".specimen-stage").getBoundingClientRect();
			const sample = panel.querySelector(".specimen-applied .specimen-text").getBoundingClientRect();
			const specimen = panel.closest(".specimen").getBoundingClientRect();
			const cue = hero.querySelector(".hero-scroll").getBoundingClientRect();
			const label = panel.querySelector(".specimen-label").getBoundingClientRect();
			return {
				index,
				sampleHeight: sample.height,
				fits: sample.top >= stage.top && sample.bottom <= stage.bottom + 1 && sample.bottom <= label.top + 1 &&
					sample.left >= stage.left - 1 && sample.right <= stage.right + 1,
				cueGap: cue.top - specimen.bottom,
				heroHeight: hero.offsetHeight,
				installTop: document.querySelector("#install").offsetTop,
			};
		};
		const probe = await openPage({ width: 320, height: 812 });
		try {
			await probe.setContent('<main class="landing-intro"><div class="specimen"><div class="specimen-panels" data-example="0" data-width-step="1" data-phase="kowrap"><div class="specimen-stage"><div class="specimen-applied"><p class="specimen-text">Test</p></div></div><span class="specimen-label">Label</span></div></div><div class="hero-scroll">Scroll</div><div id="install">Install</div></main>');
			assert.equal((await probe.evaluate(captureMobileScene, [])).index, "0");
			await probe.locator(".specimen-panels").evaluate(panel => { panel.dataset.example = "1"; panel.dataset.phase = "native"; });
			assert.equal(await probe.evaluate(captureMobileScene, []), false, "transition after readiness is not counted");
			await probe.locator(".specimen-panels").evaluate(panel => { panel.dataset.phase = "kowrap"; panel.dataset.widthStep = "0"; });
			assert.equal(await probe.evaluate(captureMobileScene, []), false, "wrong width step is not counted");
			await probe.locator(".specimen-panels").evaluate(panel => { panel.dataset.widthStep = "1"; });
			assert.equal(await probe.evaluate(captureMobileScene, ["1"]), false, "seen scene is not counted");
			assert.equal((await probe.evaluate(captureMobileScene, ["0"])).index, "1");
		} finally {
			await probe.close();
		}
		const verifyMobileScenes = async (language, width) => {
			const compact = await openPage({ width, height: 812 });
			try {
				await compact.emulateMedia({ reducedMotion: "no-preference" });
				await compact.goto(language ? `${origin}/${language}/` : `${origin}/`);
				await compact.evaluate(() => document.fonts.ready);
				await compact.locator(".specimen-panels").scrollIntoViewIfNeeded();
				await compact.locator('.specimen[data-rotating="true"]').waitFor();
				const seen = [];
				let longest = 0;
				let initial;
				while (seen.length < 8) {
					const snapshot = await compact.waitForFunction(captureMobileScene, seen, { timeout: 40000 }).catch(error => {
						throw new Error(`Mobile scene audit ${language || "ko"} ${width}px timed out; observed ${seen.length}/8 scenes (${seen.join(", ") || "none"})`, { cause: error });
					});
					const geometry = await snapshot.jsonValue();
					await snapshot.dispose();
					assert.ok(!seen.includes(geometry.index), "each mobile scene is examined once");
					seen.push(geometry.index);
					const label = `${language || "ko"} ${width}px scene ${geometry.index}`;
					assert.ok(geometry.fits, `mobile specimen fits its reserved stage: ${label} ${JSON.stringify(geometry)}`);
					assert.ok(geometry.cueGap >= -1 && geometry.cueGap <= 16, `scroll cue placement: ${label}`);
					initial ??= geometry;
					assert.ok(Math.abs(geometry.heroHeight - initial.heroHeight) <= 1 && Math.abs(geometry.installTop - initial.installTop) <= 1, `stable landing layout: ${label}`);
					if (geometry.sampleHeight > longest) {
						longest = geometry.sampleHeight;
						await compact.screenshot({ path: `test-results/renewal/longest-${language || "ko"}-${width}.png` });
					}
				}
				console.log(`Mobile scene audit ${language || "ko"} ${width}px: ${seen.length} unique scenes; maximum text height ${longest}px`);
			} finally {
				await compact.close();
			}
		};
		await Promise.all(["", "en", "ja", "zh"].flatMap(language => [320, 375, 430].map(width => verifyMobileScenes(language, width))));
	}
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
	assert.equal(await reduced.locator(".specimen-text:visible").count(), 1);
	await reduced.getByRole("link", { name: "내 문장으로 체험하기" }).click();
	await reduced.locator("#demo-width").press("Home");
	await reduced.waitForFunction(() => [...document.querySelectorAll(".preview-ruler > span")].every((marker) => {
		const width = marker.closest(".preview-stage").querySelector(".preview-text").getBoundingClientRect().width;
		const style = getComputedStyle(marker);
		return width === 180 && style.transitionProperty === "none" && new DOMMatrixReadOnly(style.transform).m41 === width;
	}));
	assert.ok(await reduced.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), "the narrow landing fits when fonts fail");
	const guides = await readdir(resolve(root, "docs"), { withFileTypes: true });
	const coreReference = await openPage(desktop);
	await coreReference.goto(`${origin}/docs/core/`);
	assert.equal(await coreReference.locator(".doc-requirement.is-required").count(), 2);
	assert.equal(await coreReference.getByRole("columnheader", { name: "필수 여부" }).evaluate(header => getComputedStyle(header).whiteSpace), "nowrap");
	assert.ok(await coreReference.locator(".doc-requirement").filter({ hasText: "선택" }).count() >= 4);
	assert.match(await coreReference.locator("tr").filter({ hasText: "measure" }).first().innerText(), /필수/);
	await coreReference.close();
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
