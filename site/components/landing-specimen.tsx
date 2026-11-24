"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { WrapLocale } from "@oddmash/kowrap";
import { WrapText } from "@oddmash/kowrap/react";
import { specimenText } from "../lib/specimen";
import { engineLocale } from "../lib/locales";
import type { SiteLocale } from "../lib/locales";

const examples: { label: string; text: string; width: string; locale: WrapLocale }[] = [
	{ label: "한국어", text: specimenText, width: "10.8em", locale: "ko" },
	{ label: "English", text: "Build a better experience for everyone.", width: "12em", locale: "en" },
	{ label: "日本語", text: "読みやすい文章を、もっと自然に。", width: "9em", locale: "ja" },
	{ label: "简体中文", text: "让每一句话都读起来更加自然。", width: "8em", locale: "zh-Hans" },
];

const wordsIn = (element: HTMLElement) => Array.from(element.querySelectorAll<HTMLElement>("[data-word]"));

const motionLabels = { ko: ["자동 줄바꿈 시연", "시연 재생", "시연 일시정지"], en: ["Live wrapping demonstration", "Play", "Pause"], ja: ["改行のデモ", "再生", "一時停止"], zh: ["换行演示", "播放", "暂停"] } as const;
export const LandingSpecimen = ({ initialLocale = "ko" }: { initialLocale?: SiteLocale }) => {
	const section = useRef<HTMLElement>(null);
	const before = useRef<HTMLParagraphElement>(null);
	const after = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(() => Math.max(0, examples.findIndex(example => example.locale === engineLocale(initialLocale))));
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
			const destinations = next.map(word => word.getBoundingClientRect());
			const sources = old.map(word => word.getBoundingClientRect());
			const moved = destinations.map((box, i) => Math.abs(box.top - sources[i].top) > 1);
			if (!moved.some(Boolean)) { setPhase("kowrap"); return; }
			next.forEach((word, i) => {
				const changedLine = destinations.some((box, j) => moved[j] && Math.abs(box.top - destinations[i].top) <= 1);
				if (changedLine) word.dataset.reflow = moved[i] ? "moved" : "neighbor";
			});
			setPhase("css");
			animations = next.flatMap((word, i) => {
				const source = sources[i];
				const destination = destinations[i];
				const visual = word.firstElementChild;
				if (!(visual instanceof HTMLElement) || typeof visual.animate !== "function") return [];
				const from = `translate(${source.left - destination.left}px, ${source.top - destination.top}px)`;
				return [visual.animate([
					{ transform: from, offset: 0 },
					{ transform: from, offset: .42, easing: "cubic-bezier(.22, 1, .36, 1)" },
					{ transform: "translate(0, 0)", offset: 1 },
				], { duration: 1850, fill: "both" })];
			});
			settle = window.setTimeout(() => setPhase("kowrap"), 1850);
		};
		const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
		const finish = () => {
			animations.forEach(animation => animation.cancel());
			applied.querySelectorAll<HTMLElement>("[data-reflow]").forEach(word => delete word.dataset.reflow);
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
			applied.querySelectorAll<HTMLElement>("[data-reflow]").forEach(word => delete word.dataset.reflow);
		};
	}, [index, rotating]);

	const units = example.locale === "ja" || example.locale === "zh-Hans"
		? Array.from(new Intl.Segmenter(example.locale, { granularity: "grapheme" }).segment(example.text), item => item.segment)
		: example.text.split(/(\s+)/u);
	const sample = () => units.map((word, i) => /^\s+$/u.test(word) ? <Fragment key={i}>{word}</Fragment> : (
		<span key={i} data-word={i}><span className="specimen-word-visual">{word}</span></span>
	));

	return (
		<section ref={section} className="specimen" id="playground" aria-label={motionLabels[initialLocale][0]} data-rotating={rotating}>
			<div className="specimen-panels" lang={example.locale} data-example={index} data-phase={phase} style={{ "--specimen-width": example.width } as CSSProperties}>
				<div className="specimen-stage">
					<div className="specimen-ruler" aria-hidden="true"><span /></div>
					<div className="specimen-layout">
						<p key={`css-${index}`} ref={before} className="specimen-text specimen-native" aria-hidden="true">{sample()}</p>
						<div ref={after} className="specimen-applied"><WrapText key={index} as="p" locale={example.locale} className="specimen-text" style={{ textWrap: "wrap" }}>{sample()}</WrapText></div>
					</div>
				</div>
				<div className="specimen-label">
					<span className="sr-only">{example.label}</span>
					{!reduced && <button type="button" className="specimen-pause" aria-label={motionLabels[initialLocale][paused ? 1 : 2]} onClick={() => setPaused(value => !value)}>{paused ? "▶" : "Ⅱ"}</button>}
				</div>
			</div>
		</section>
	);
};
