"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { WrapText } from "@oddmash/kowrap/react";
import { specimenText } from "../lib/specimen";

const examples = [
	{ label: "서비스 제목", text: specimenText, width: "10.8em" },
	{ label: "콘텐츠", text: "오늘의 발견을 함께 나누는 작은 이야기", width: "11.6em" },
	{ label: "제품 소개", text: "새로운 기능을 지금 만나보세요.", width: "8.8em" },
	{ label: "개발 도구", text: "React와 TypeScript로 더 나은 화면을 만드세요", width: "10.8em" },
];

const wordsIn = (element: HTMLElement) => Array.from(element.querySelectorAll<HTMLElement>("[data-word]"));

export const LandingSpecimen = () => {
	const section = useRef<HTMLElement>(null);
	const before = useRef<HTMLParagraphElement>(null);
	const after = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);
	const [visible, setVisible] = useState(false);
	const [reduced, setReduced] = useState(true);
	const [paused, setPaused] = useState(false);
	const [phase, setPhase] = useState<"css" | "kowrap">("kowrap");
	const example = examples[index];
	const rotating = visible && !reduced && !paused;

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
		const native = before.current;
		const applied = after.current;
		if (!native || !applied || !rotating) {
			setPhase("kowrap");
			return;
		}
		let animations: Animation[] = [];
		let frame = 0;

		let settle: number | undefined;
		let played = false;
		let measuredWidth = 0;
		const measure = () => {
			const target = applied.querySelector("p");
			if (!target) return;
			const old = wordsIn(native);
			const next = wordsIn(target);
			if (!old.length || old.length !== next.length) return;
			if (played) return;
			if (!target.querySelector("br[data-kowrap-break]") || document.fonts?.status === "loading") return;
			played = true;
			measuredWidth = native.getBoundingClientRect().width;
			const moved = next.some((word, i) => Math.abs(word.getBoundingClientRect().top - old[i].getBoundingClientRect().top) > 1);
			if (!moved) { setPhase("kowrap"); return; }
			setPhase("css");
			animations = next.flatMap((word, i) => {
				const source = old[i].getBoundingClientRect();
				const destination = word.getBoundingClientRect();
				const visual = word.firstElementChild;
				if (!(visual instanceof HTMLElement) || typeof visual.animate !== "function") return [];
				const from = `translate(${source.left - destination.left}px, ${source.top - destination.top}px)`;
				return [visual.animate([
					{ transform: from, offset: 0 },
					{ transform: from, offset: .47, easing: "cubic-bezier(.22, 1, .36, 1)" },
					{ transform: "translate(0, 0)", offset: 1 },
				], { duration: 1850, fill: "both" })];
			});
			settle = window.setTimeout(() => setPhase("kowrap"), 870);
		};
		const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
		const finish = () => {
			animations.forEach(animation => animation.cancel());
			setPhase("kowrap");
			played = true;
		};
		const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => {
			if (played && Math.abs(native.getBoundingClientRect().width - measuredWidth) > 1) finish();
			else schedule();
		});
		resize?.observe(native);
		const mutation = new MutationObserver(schedule);
		mutation.observe(applied, { childList: true, subtree: true });
		window.addEventListener("resize", schedule);
		document.fonts?.addEventListener("loadingdone", schedule);
		schedule();
		const advance = window.setTimeout(() => setIndex(value => (value + 1) % examples.length), 5200);
		return () => {
			resize?.disconnect();
			mutation.disconnect();
			window.removeEventListener("resize", schedule);
			document.fonts?.removeEventListener("loadingdone", schedule);
			cancelAnimationFrame(frame);
			window.clearTimeout(advance);
			window.clearTimeout(settle);
			animations.forEach(animation => animation.cancel());
		};
	}, [index, rotating]);

	const sample = () => example.text.split(" ").map((word, i) => (
		<Fragment key={i}>{i > 0 && " "}<span data-word={i}><span className="specimen-word-visual">{word}</span></span></Fragment>
	));

	return (
		<section ref={section} className="specimen" id="playground" aria-label="자동 줄바꿈 시연" data-rotating={rotating}>
			<div className="specimen-panels" data-example={index} data-phase={phase} style={{ "--specimen-width": example.width } as CSSProperties}>
				<div className="specimen-label">
					<span>{example.label}</span>
					<span className="specimen-mode"><span aria-hidden="true" />{phase === "css" ? "기본 CSS" : "Kowrap 적용"}</span>
				</div>
				<div className="specimen-stage">
					<div className="specimen-ruler" aria-hidden="true"><span /></div>
					<div className="specimen-layout">
						<p key={`css-${index}`} ref={before} className="specimen-text specimen-native" aria-hidden="true">{sample()}</p>
						<div ref={after} className="specimen-applied"><WrapText key={index} as="p" className="specimen-text" style={{ textWrap: "wrap" }}>{sample()}</WrapText></div>
					</div>
				</div>
				<div className="specimen-footer"><span>같은 문장, 더 자연스러운 줄바꿈.</span>{!reduced && <button type="button" className="specimen-pause" aria-label={paused ? "시연 재생" : "시연 일시정지"} onClick={() => setPaused(value => !value)}>{paused ? "▶" : "Ⅱ"}</button>}</div>
			</div>
		</section>
	);
};
