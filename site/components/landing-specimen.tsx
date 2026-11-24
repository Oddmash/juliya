"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useJuliya } from "@oddmash/kowrap/react";
import { engineLocale } from "../lib/locales";
import type { SiteLocale } from "../lib/locales";
import { shuffledSceneIndices, specimenScenes } from "../lib/specimen-scenes";

const motionLabels = { ko: ["자동 줄바꿈 시연", "시연 재생", "시연 일시정지"], en: ["Live wrapping demonstration", "Play", "Pause"], ja: ["改行のデモ", "再生", "一時停止"], zh: ["换行演示", "播放", "暂停"] } as const;
const widthRatios = ["100%", "78%", "92%"] as const;
type Phase = "css" | "kowrap" | "resize" | "leaving";

const positions = (element: HTMLElement) => {
	const top = element.getBoundingClientRect().top;
	return new Map(Array.from(element.querySelectorAll<HTMLElement>("[data-word]"), word => {
		const bounds = word.getBoundingClientRect();
		const visual = word.firstElementChild as HTMLElement;
		return [word.dataset.word!, { word, visual, bounds, visualBounds: visual.getBoundingClientRect(), row: bounds.top - top }] as const;
	}));
};

const narrowWidthFor = (element: HTMLElement, preset: number) => {
	const rows = new Map<number, { left: number; right: number }>();
	let widestWord = 0;
	for (const { bounds, row } of positions(element).values()) {
		const key = Math.round(row);
		const previous = rows.get(key);
		rows.set(key, { left: Math.min(previous?.left ?? bounds.left, bounds.left), right: Math.max(previous?.right ?? bounds.right, bounds.right) });
		widestWord = Math.max(widestWord, bounds.width);
	}
	const longestLine = Math.max(0, ...Array.from(rows.values(), ({ left, right }) => right - left));
	const width = element.getBoundingClientRect().width;
	const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
	const narrow = Math.min(preset * fontSize, width * .88, longestLine * .88);
	return Math.max(1, Math.min(width - 12, Math.max(widestWord + 2, narrow)));
};

const specimenUnits = (text: string, locale: SiteLocale) => locale === "ja" || locale === "zh"
	? Array.from(new Intl.Segmenter(engineLocale(locale), { granularity: "grapheme" }).segment(text), item => item.segment)
	: text.split(/(\s+)/u).filter(Boolean);

const sampleText = (units: string[], offsets: number[] = []) => {
	let cursor = 0;
	return units.map(unit => {
		const start = cursor;
		cursor += unit.length;
		const boundaries = offsets.filter(offset => start < offset && offset <= cursor);
		const ends = boundaries.includes(cursor) ? boundaries : [...boundaries, cursor];
		let position = start;
		return ends.map(end => {
			const part = unit.slice(position - start, end - start);
			const key = position;
			position = end;
			return <Fragment key={key}>
				{/^\s+$/u.test(part) ? part : <span data-word={key}><span className="specimen-word-visual">{part}</span></span>}
				{boundaries.includes(end) && <br data-kowrap-break="" />}
			</Fragment>;
		});
	});
};

const Specimen = ({ initialLocale }: { initialLocale: SiteLocale }) => {
	const section = useRef<HTMLElement>(null);
	const before = useRef<HTMLParagraphElement>(null);
	const after = useRef<HTMLDivElement>(null);
	const queue = useRef<number[]>([]);
	const [index, setIndex] = useState(0);
	const [widthStep, setWidthStep] = useState<0 | 1 | 2>(0);
	const [narrowWidth, setNarrowWidth] = useState<number>();
	const [visible, setVisible] = useState(false);
	const [reduced, setReduced] = useState(true);
	const [paused, setPaused] = useState(false);
	const [pausedWidth, setPausedWidth] = useState<number>();
	const [phase, setPhase] = useState<Phase>("kowrap");
	const examples = specimenScenes[initialLocale];
	const example = examples[index];
	const locale = engineLocale(initialLocale);
	const rotating = visible && !reduced && !paused;
	const units = useMemo(() => specimenUnits(example.text, initialLocale), [example.text, initialLocale]);
	const { ref, lines } = useJuliya({ text: example.text, locale, tag: "p" });
	const breaks = lines.slice(0, -1).map(line => line.end);
	const togglePaused = () => {
		if (paused) {
			setPausedWidth(undefined);
			setPaused(false);
			return;
		}
		setPausedWidth(after.current?.querySelector("p")?.getBoundingClientRect().width);
		setPaused(true);
	};

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
		if (!rotating) {
			setPhase("kowrap");
			return;
		}
		const timers = [
			window.setTimeout(() => {
				const target = after.current?.querySelector("p");
				if (target) {
					const measured = narrowWidthFor(target, example.widths[1]);
					setNarrowWidth(existing => existing ?? measured);
				}
				setWidthStep(1);
				setPhase("resize");
			}, 2050),
			window.setTimeout(() => setPhase("kowrap"), 3350),
			window.setTimeout(() => { setWidthStep(2); setPhase("resize"); }, 3900),
			window.setTimeout(() => setPhase("kowrap"), 5200),
			window.setTimeout(() => setPhase("leaving"), 6100),
			window.setTimeout(() => {
				if (!queue.current.length) queue.current = shuffledSceneIndices(examples.length, index);
				const next = queue.current.shift() ?? 0;
				setWidthStep(0);
				setNarrowWidth(undefined);
				setIndex(next);
				setPhase("kowrap");
			}, 6600),
		];
		return () => timers.forEach(timer => window.clearTimeout(timer));
	}, [example, examples, index, rotating]);

	useEffect(() => {
		const native = before.current;
		const applied = after.current;
		if (!native || !applied || !rotating) return;
		const animations = new Map<string, Animation>();
		let frame: number | undefined;
		let settle: number | undefined;
		let previous: ReturnType<typeof positions> | undefined;
		let played = false;
		const measure = () => {
			const target = applied.querySelector("p");
			if (!target || document.fonts?.status === "loading") return;
			const current = positions(target);
			if (!current.size) return;
			const initial = !played;
			if (initial && !target.querySelector("[data-kowrap-break]")) {
				played = true;
				previous = current;
				return;
			}
			const old = initial ? positions(native) : previous;
			if (!old) return;
			played = true;
			const moved = [...current].filter(([key, destination]) => {
				const source = old.get(key);
				return source && Math.abs(source.row - destination.row) > 1;
			});
			const shifted = [...current].some(([key, destination]) => {
				const source = old.get(key);
				return source && Math.abs(source.bounds.top - destination.bounds.top) > 1;
			});
			if (moved.length || shifted) {
				const movedKeys = new Set(moved.map(([key]) => key));
				const movedRows = moved.map(([, destination]) => destination.row);
				for (const [key, destination] of current) {
					if (movedRows.some(row => Math.abs(row - destination.row) <= 1)) destination.word.dataset.reflow = movedKeys.has(key) ? "moved" : "neighbor";
					else delete destination.word.dataset.reflow;
					const source = old.get(key);
					if (!source || (!initial && !movedKeys.has(key) && Math.abs(source.bounds.top - destination.bounds.top) <= 1) || typeof destination.visual.animate !== "function") continue;
					const dx = source.visualBounds.left - destination.bounds.left;
					const dy = source.visualBounds.top - destination.bounds.top;
					if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
					animations.get(key)?.cancel();
					const from = `translate(${dx}px, ${dy}px)`;
					animations.set(key, destination.visual.animate(initial ? [
						{ transform: from, offset: 0 },
						{ transform: from, offset: .34, easing: "cubic-bezier(.22, 1, .36, 1)" },
						{ transform: "translate(0, 0)", offset: 1 },
					] : [
						{ transform: from },
						{ transform: "translate(0, 0)" },
					], { duration: initial ? 1450 : 540, easing: initial ? "linear" : "cubic-bezier(.22,1,.36,1)" }));
				}
				if (initial) {
					setPhase(phase => phase === "kowrap" ? "css" : phase);
					settle = window.setTimeout(() => setPhase(phase => phase === "css" ? "kowrap" : phase), 1450);
				}
			}
			previous = moved.length || shifted ? positions(target) : current;
		};
		const schedule = () => {
			if (frame !== undefined) return;
			frame = requestAnimationFrame(() => { frame = undefined; measure(); });
		};
		const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
		resize?.observe(native);
		const target = applied.querySelector("p");
		if (target) resize?.observe(target);
		const mutation = new MutationObserver(measure);
		mutation.observe(applied, { childList: true, subtree: true, characterData: true });
		window.addEventListener("resize", schedule);
		document.fonts?.addEventListener("loadingdone", schedule);
		schedule();
		return () => {
			resize?.disconnect();
			mutation.disconnect();
			window.removeEventListener("resize", schedule);
			document.fonts?.removeEventListener("loadingdone", schedule);
			if (frame !== undefined) cancelAnimationFrame(frame);
			window.clearTimeout(settle);
			animations.forEach(animation => animation.cancel());
			applied.querySelectorAll<HTMLElement>("[data-reflow]").forEach(word => delete word.dataset.reflow);
		};
	}, [index, rotating]);

	return (
		<section ref={section} className="specimen" id="playground" aria-label={motionLabels[initialLocale][0]} data-rotating={rotating}>
			<div className="specimen-panels" lang={locale} data-example={index} data-phase={phase} data-width-step={widthStep} style={{ "--specimen-width": pausedWidth !== undefined ? `${pausedWidth}px` : widthStep === 1 && narrowWidth !== undefined ? `${narrowWidth}px` : `${example.widths[widthStep]}em`, "--specimen-ratio": pausedWidth !== undefined ? "100%" : widthRatios[widthStep] } as CSSProperties}>
				<div className="specimen-stage">
					<div className="specimen-ruler" aria-hidden="true"><span /></div>
					<div className="specimen-layout">
						<p ref={before} className="specimen-text specimen-native" aria-hidden="true">{sampleText(units)}</p>
						<div ref={after} className="specimen-applied"><p ref={ref} className="specimen-text">{sampleText(units, breaks)}</p></div>
					</div>
				</div>
				<div className="specimen-label">
					{!reduced && <button type="button" className="specimen-pause" aria-label={motionLabels[initialLocale][paused ? 1 : 2]} onClick={togglePaused}>{paused ? "▶" : "Ⅱ"}</button>}
				</div>
			</div>
		</section>
	);
};

export const LandingSpecimen = ({ initialLocale = "ko" }: { initialLocale?: SiteLocale }) => <Specimen key={initialLocale} initialLocale={initialLocale} />;
