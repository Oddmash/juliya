"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { WrapText } from "@oddmash/kowrap/react";
import { specimenText } from "../lib/specimen";

const examples = [
	{ label: "서비스 제목", text: specimenText },
	{ label: "콘텐츠", text: "좋은 글은 읽기 편한 화면에서 시작됩니다" },
	{ label: "제품 소개", text: "복잡한 일상에서 필요한 것을 더 쉽게 찾으세요" },
	{ label: "개발 도구", text: "React와 TypeScript로 더 나은 화면을 만드세요" },
];

const boxes = (element: HTMLElement) => Array.from(element.querySelectorAll<HTMLElement>("[data-word]"), word => word.getBoundingClientRect());

export const LandingSpecimen = () => {
	const section = useRef<HTMLElement>(null);
	const before = useRef<HTMLParagraphElement>(null);
	const after = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);
	const [visible, setVisible] = useState(false);
	const [reduced, setReduced] = useState(true);
	const [selected, setSelected] = useState(false);
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);
	const [difference, setDifference] = useState<{ index: number; from: number; to: number } | null>(null);
	const [ready, setReady] = useState(false);
	const words = examples[index].text.split(" ");

	useEffect(() => {
		const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => setReduced(preference.matches);
		sync();
		preference.addEventListener("change", sync);
		const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)) : undefined;
		if (section.current && observer) observer.observe(section.current);
		else setVisible(true);
		return () => { preference.removeEventListener("change", sync); observer?.disconnect(); };
	}, []);

	useEffect(() => {
		if (!visible || reduced || selected || hovered || focused || index === examples.length - 1) return;
		const timer = window.setTimeout(() => {
			setReady(false);
			setDifference(null);
			setIndex(value => value + 1);
		}, 4800);
		return () => window.clearTimeout(timer);
	}, [visible, reduced, selected, hovered, focused, index]);

	useEffect(() => {
		const native = before.current;
		const applied = after.current;
		if (!native || !applied) return;
		let frame = 0;
		const measure = () => {
			const target = applied.querySelector("p");
			if (!target) return;
			const old = boxes(native);
			const next = boxes(target);
			if (!old.length || old.length !== next.length) return;
			const line = (items: DOMRect[], element: HTMLElement, i: number) => 1 + Math.round((items[i].top - items[0].top) / parseFloat(getComputedStyle(element).lineHeight));
			const moved = next.findIndex((_, i) => line(old, native, i) !== line(next, target, i));
			const result = moved < 0 ? null : { index: moved, from: line(old, native, moved), to: line(next, target, moved) };
			setDifference(previous => JSON.stringify(previous) === JSON.stringify(result) ? previous : result);
			setReady(true);
		};
		const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
		const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
		resize?.observe(native);
		resize?.observe(applied);
		const mutation = new MutationObserver(schedule);
		mutation.observe(applied, { childList: true, subtree: true });
		window.addEventListener("resize", schedule);
		document.fonts?.addEventListener("loadingdone", schedule);
		schedule();
		return () => { resize?.disconnect(); mutation.disconnect(); window.removeEventListener("resize", schedule); document.fonts?.removeEventListener("loadingdone", schedule); cancelAnimationFrame(frame); };
	}, [index]);

	const sample = () => words.map((word, i) => (
		<Fragment key={i}>{i > 0 && " "}<span data-word={i} data-moved={difference?.index === i ? "" : undefined}>{word}</span></Fragment>
	));

	return (
		<section ref={section} className="specimen" id="playground" aria-label="줄바꿈 비교" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
			<div className="specimen-examples" aria-label="비교할 예제">
				{examples.map((example, i) => <button key={example.label} type="button" aria-pressed={index === i} onClick={() => { setSelected(true); if (i !== index) { setReady(false); setDifference(null); setIndex(i); } }}>{example.label}</button>)}
			</div>
			<div className="specimen-panels" data-example={index}>
				<div className="specimen-panel specimen-native">
					<div className="specimen-label"><span>기본 CSS</span><code>keep-all</code></div>
					<div className="specimen-stage"><p key={index} className="specimen-text" ref={before}>{sample()}</p></div>
				</div>
				<div className="specimen-panel specimen-applied">
					<div className="specimen-label"><span>Kowrap</span><span>의미 기반 줄바꿈</span></div>
					<div className="specimen-stage" ref={after}><WrapText key={index} as="p" className="specimen-text" style={{ textWrap: "wrap" }}>{sample()}</WrapText></div>
				</div>
			</div>
			<p className="specimen-status" aria-live={selected ? "polite" : "off"}>{difference ? `‘${words[difference.index]}’ 위치: ${difference.from}번째 줄 → ${difference.to}번째 줄` : ready ? "이 너비에서는 두 방식의 줄바꿈이 같습니다." : "동일한 조건에서 줄바꿈 결과를 비교합니다."}</p>
		</section>
	);
};
