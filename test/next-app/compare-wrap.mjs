import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";

const pretext = process.argv[2];
if (!pretext)
  throw new Error("Pass the path to the installed @chenglou/pretext package");
const version = JSON.parse(
  await readFile(resolve(pretext, "package.json"), "utf8"),
).version;
const roots = {
  kowrap: fileURLToPath(new URL("../../dist/", import.meta.url)),
  pretext: resolve(pretext, "dist"),
};

for (const engine of [chromium, firefox, webkit]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage();
    await page.route("http://kowrap.test/**", async (route) => {
      const [name, ...segments] = new URL(route.request().url()).pathname
        .slice(1)
        .split("/");
      if (!name)
        return route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><html lang="ko"><body></body></html>',
        });
      if (!Object.hasOwn(roots, name)) return route.abort();
      const root = roots[name];
      const path = resolve(root, ...segments);
      if (!path.startsWith(resolve(root) + sep)) return route.abort();
      return route.fulfill({
        contentType: "text/javascript",
        body: await readFile(path),
      });
    });
    await page.goto("http://kowrap.test/");
    const results = await page.evaluate(async () => {
      const { wrap } = await import("/kowrap/index.js");
      const { createCanvasMeasure } = await import("/kowrap/dom/index.js");
      const { prepareWithSegments, layoutWithLines, setLocale } =
        await import("/pretext/layout.js");
      setLocale("ko");
      const texts = [
        "좋은 글은 보기 편한 화면에서 시작됩니다.",
        "작은 화면에서도 읽는 흐름을 잃지 않도록 문장과 어절을 고려해 자연스럽게 줄을 바꿉니다.",
        "React와 TypeScript로 만든 서비스에 kowrap을 적용해 한국어 UI의 읽기 경험을 개선하세요.",
      ];
      const sample = document.createElement("div");
      Object.assign(sample.style, {
        whiteSpace: "pre-wrap",
        wordBreak: "keep-all",
        overflowWrap: "anywhere",
        textWrap: "wrap",
      });
      document.body.append(sample);
      const cases = ["sans-serif", "serif", "monospace"].flatMap(
        (family, index) => {
          const size = [17, 23, 19][index];
          const font = `${size}px ${family}`;
          const lineHeight = size * 2;
          const measure = createCanvasMeasure({ font });
          return texts.map((text) => ({
            font,
            lineHeight,
            measure,
            text,
            prepared: prepareWithSegments(text, font, {
              wordBreak: "keep-all",
              whiteSpace: "pre-wrap",
            }),
          }));
        },
      );
      const widths = [160, 240, 320];
      const render = (entry, width, lines) => {
        Object.assign(sample.style, {
          font: entry.font,
          lineHeight: `${entry.lineHeight}px`,
          width: `${width}px`,
        });
        sample.replaceChildren(
          ...(lines
            ? lines.flatMap((line, index) => [
                ...(index ? [document.createElement("br")] : []),
                line.text,
              ])
            : [entry.text]),
        );
        return sample.offsetHeight / entry.lineHeight;
      };
      const modes = {
        css: () => undefined,
        kowrap: (entry, width) =>
          wrap(entry.text, { width, measure: entry.measure }),
        pretext: (entry, width) =>
          layoutWithLines(entry.prepared, width, entry.lineHeight).lines,
      };
      const spread = () => {
        const range = document.createRange();
        range.selectNodeContents(sample);
        const widthsByLine = new Map();
        for (const rect of range.getClientRects()) {
          if (rect.width > 0)
            widthsByLine.set(
              rect.top,
              (widthsByLine.get(rect.top) ?? 0) + rect.width,
            );
        }
        const values = [...widthsByLine.values()];
        return Math.max(...values) - Math.min(...values);
      };
      return Object.entries(modes).map(([mode, layout]) => {
        let lineCount = 0;
        let extraNativeBreaks = 0;
        let relativeSpread = 0;
        let overflow = 0;
        for (const entry of cases)
          for (const width of widths) {
            const lines = layout(entry, width);
            const rendered = render(entry, width, lines);
            lineCount += rendered;
            extraNativeBreaks += lines && rendered > lines.length ? 1 : 0;
            relativeSpread += spread() / width;
            overflow += sample.scrollWidth > sample.clientWidth ? 1 : 0;
          }
        const count = cases.length * widths.length;
        const trials = [];
        for (let trial = 0; trial < 7; trial++) {
          const start = performance.now();
          for (let repeat = 0; repeat < 10; repeat++) {
            for (const entry of cases)
              for (const width of widths)
                render(entry, width, layout(entry, width));
          }
          trials.push((performance.now() - start) / (10 * count));
        }
        return {
          mode,
          cases: count,
          lineCount,
          extraNativeBreaks,
          overflow,
          meanLineWidthSpreadPct: +((100 * relativeSpread) / count).toFixed(1),
          medianMsPerRender: +trials.sort((a, b) => a - b)[3].toFixed(3),
        };
      });
    });
    console.log(`${engine.name()} ${browser.version()} (Pretext ${version})`);
    console.table(results);
  } finally {
    await browser.close();
  }
}
