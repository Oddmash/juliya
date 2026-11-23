"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { WrapText } from "@oddmash/kowrap/react";
import { Button } from "@oddmash/ui/button";
import { specimenText } from "../lib/specimen";

const words = specimenText.split(" ");
const wordBoxes = (layer: HTMLElement) =>
	Array.from(layer.querySelectorAll<HTMLElement>("[data-word]"), (word) => word.getBoundingClientRect());

type Difference = { index: number; from: number; to: number; dx: number; dy: number };

export const LandingSpecimen = () => {
	const before = useRef<HTMLParagraphElement>(null);
	const after = useRef<HTMLDivElement>(null);
	const marker = useRef<HTMLSpanElement>(null);
	const ghost = useRef<HTMLSpanElement>(null);
	const animation = useRef<Animation | null>(null);
	const ghostAnimation = useRef<Animation | null>(null);
	const differenceRef = useRef<Difference | null>(null);
	const initialPlayed = useRef(false);
	const [difference, setDifference] = useState<Difference | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const native = before.current;
		const applied = after.current;
		if (!native || !applied) return;
		let frame = 0;
		const measure = () => {
			const target = applied.querySelector("p");
			if (!target) return;
			const old = wordBoxes(native);
			const next = wordBoxes(target);
			if (old.length !== words.length || next.length !== words.length) return;
			const fromLineHeight = parseFloat(getComputedStyle(native).lineHeight);
			const toLineHeight = parseFloat(getComputedStyle(target).lineHeight);
			const fromLine = (index: number) => 1 + Math.round((old[index].top - old[0].top) / fromLineHeight);
			const toLine = (index: number) => 1 + Math.round((next[index].top - next[0].top) / toLineHeight);
			const index = next.findIndex((_, i) => fromLine(i) !== toLine(i));
			const result = index < 0 ? null : {
				index, from: fromLine(index), to: toLine(index),
				dx: old[index].left - old[0].left - (next[index].left - next[0].left),
				dy: old[index].top - old[0].top - (next[index].top - next[0].top),
			};
			if (JSON.stringify(differenceRef.current) !== JSON.stringify(result)) {
				animation.current?.cancel();
				ghostAnimation.current?.cancel();
			}
			differenceRef.current = result;
			setDifference((previous) => JSON.stringify(previous) === JSON.stringify(result) ? previous : result);
			setReady(true);
		};
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		};
		const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
		observer?.observe(native);
		observer?.observe(applied);
		const mutation = new MutationObserver(schedule);
		mutation.observe(applied, { childList: true, subtree: true });
		window.addEventListener("resize", schedule);
		document.fonts?.addEventListener("loadingdone", schedule);
		const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
		const cancel = () => { animation.current?.cancel(); ghostAnimation.current?.cancel(); };
		preference.addEventListener("change", cancel);
		schedule();
		return () => {
			observer?.disconnect();
			mutation.disconnect();
			window.removeEventListener("resize", schedule);
			document.fonts?.removeEventListener("loadingdone", schedule);
			preference.removeEventListener("change", cancel);
			cancelAnimationFrame(frame);
			cancel();
		};
	}, []);

	const replay = useCallback(() => {
		initialPlayed.current = true;
		const measured = differenceRef.current;
		const cue = marker.current;
		if (!measured || !cue) return;
		const transform = animation.current?.playState === "running" ? getComputedStyle(cue).transform : `translate(${measured.dx}px, ${measured.dy}px)`;
		animation.current?.cancel();
		ghostAnimation.current?.cancel();
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !cue.animate) return;
		const timing = { duration: 520, easing: "cubic-bezier(.22, 1, .36, 1)" };
		animation.current = cue.animate([{ transform, opacity: 0.6 }, { transform: "translate(0, 0)", opacity: 1 }], timing);
		ghostAnimation.current = ghost.current?.animate([{ transform, opacity: .65 }, { transform: "translate(0, 0)", opacity: 0 }], timing) ?? null;
	}, []);

	useEffect(() => {
		if (!difference || initialPlayed.current) return;
		const timer = window.setTimeout(() => {
			if (!initialPlayed.current) replay();
		}, 620);
		return () => window.clearTimeout(timer);
	}, [difference, replay]);

	const sample = (applied: boolean) => words.map((word, index) => (
		<Fragment key={index}>
			{index > 0 && " "}
			<span data-word={index} data-moved={difference?.index === index ? "" : undefined}>
				{word}
				{applied && difference?.index === index && <><span className="specimen-cue" ref={marker} aria-hidden="true" /><span className="specimen-ghost" ref={ghost} data-label={word} aria-hidden="true" /></>}
			</span>
		</Fragment>
	));

	return (
		<section className="specimen" id="playground" aria-label="줄바꿈 비교">
			<div className="specimen-panels">
				<div className="specimen-panel specimen-native">
					<div className="specimen-label"><span>01 / 기본 CSS</span><span>keep-all</span></div>
					<div className="specimen-stage"><p className="specimen-text" ref={before}>{sample(false)}</p></div>
				</div>
				<div className="specimen-panel specimen-applied">
					<div className="specimen-label"><span>02 / Kowrap</span><span>의미 기반</span></div>
					<div className="specimen-stage" ref={after}><WrapText as="p" className="specimen-text" style={{ textWrap: "wrap" }}>{sample(true)}</WrapText></div>
				</div>
			</div>
			<div className="specimen-controls">
				<p className="specimen-status" role="status">{difference ? `‘${words[difference.index]}’ 위치: ${difference.from}번째 줄 → ${difference.to}번째 줄` : ready ? "이 너비에서는 두 방식의 줄바꿈이 같습니다." : "동일한 조건에서 줄바꿈 결과를 비교합니다."}</p>
				<Button type="button" size="sm" variant="secondary" className="specimen-replay" disabled={!difference} onClick={replay}><span aria-hidden="true">↻</span> 변화 다시 보기</Button>
			</div>
		</section>
	);
};
