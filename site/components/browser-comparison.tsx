"use client";

import { useState } from "react";
import { wrap } from "@oddmash/kowrap";
import { createCanvasMeasure } from "@oddmash/kowrap/dom";
import { Button } from "@oddmash/ui/button";

const texts = [
  "팀의 모든 문서를 한곳에서 관리하세요",
  "결제 정보를 확인한 뒤 주문을 완료하세요.",
  "React와 TypeScript로 더 나은 UI를 만드세요.",
];
const widths = [160, 240, 320];
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
type Result = { mode: string; lines: number; overflow: number; median: number };

export const BrowserComparison = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    setStatus("측정 중");
    setResults([]);
    let sample: HTMLDivElement | undefined;
    try {
      await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      sample = document.createElement("div");
      Object.assign(sample.style, { position: "fixed", left: "-10000px", top: "0", visibility: "hidden", whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "anywhere", font: "400 20px sans-serif", lineHeight: "30px", textWrap: "wrap" });
      sample.setAttribute("aria-hidden", "true");
      document.body.append(sample);
      const element = sample;
      const measure = createCanvasMeasure({ font: "400 20px sans-serif" });
      const batch = (applied: boolean) => {
        let lines = 0, overflow = 0;
        for (const text of texts) for (const width of widths) {
          element.style.width = width + "px";
          if (applied) {
            const result = wrap(text, { width, measure });
            element.replaceChildren(...result.flatMap((line, index) => index ? [document.createElement("br"), document.createTextNode(line.text)] : [document.createTextNode(line.text)]));
          } else element.textContent = text;
          lines += Math.round(element.getBoundingClientRect().height / 30);
          overflow += Number(element.scrollWidth > element.clientWidth);
        }
        return { lines, overflow };
      };
      const modes = [false, true];
      const timing = [[], []] as number[][];
      modes.forEach(batch);
      for (let trial = 0; trial < 7; trial++) {
        for (const index of trial % 2 ? [1, 0] : [0, 1]) {
          const start = performance.now();
          batch(modes[index]);
          timing[index].push(performance.now() - start);
        }
      }
      setResults(modes.map((applied, index) => ({ mode: applied ? "Juliya" : "CSS keep-all", ...batch(applied), median: median(timing[index]) })));
      setStatus("측정 완료");
    } catch {
      setStatus("측정할 수 없습니다. 브라우저를 확인해 주세요.");
    } finally {
      sample?.remove();
      setBusy(false);
    }
  };
  return <section aria-labelledby="benchmark-title">
    <h2 id="benchmark-title">내 브라우저에서 비교</h2>
    <p>동일한 문장 3개와 폭 3개, 20px 글꼴로 9개 경우를 비교합니다. 7회 실행한 배치 시간의 중앙값이며 네트워크나 앱 전체 성능은 측정하지 않습니다.</p>
    <Button type="button" onClick={run} disabled={busy}>비교 실행</Button>
    <p role="status">{status}</p>
    {results.length > 0 && <div className="doc-table" tabIndex={0} role="region" aria-label="비교 결과"><table><thead><tr><th scope="col">방식</th><th scope="col">전체 줄 수</th><th scope="col">넘침 사례</th><th scope="col">배치 중앙값(ms)</th></tr></thead><tbody>{results.map(result => <tr key={result.mode}><th scope="row">{result.mode}</th><td>{result.lines}</td><td>{result.overflow}</td><td>{result.median.toFixed(2)}</td></tr>)}</tbody></table></div>}
  </section>;
};
