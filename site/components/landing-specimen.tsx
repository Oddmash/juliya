"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { WrapText } from "@oddmash/kowrap/react";
import { Button } from "@oddmash/ui/button";
import { specimenText } from "../lib/specimen";

const words = specimenText.split(" ");
const modes = [["css", "기본 CSS"], ["kowrap", "Kowrap"]] as const;
type Mode = (typeof modes)[number][0];

const wordBoxes = (layer: HTMLElement) =>
	Array.from(layer.querySelectorAll<HTMLElement>("[data-word]"), (word) => word.getClientRects()[0]);

export const LandingSpecimen = () => {
	const [mode, setMode] = useState<Mode>("css");
	const [width, setWidth] = useState(11);
	const [moved, setMoved] = useState<{ index: number; line: number }>();
	const [interacted, setInteracted] = useState(false);
	const stage = useRef<HTMLDivElement>(null);
	const ribbon = useRef<HTMLSpanElement>(null);

	const changeMode = (next: Mode) => {
		if (next === mode) return;
		const current = stage.current?.querySelector<HTMLElement>(`[data-layer="${mode}"]`);
		const target = stage.current?.querySelector<HTMLElement>(`[data-layer="${next}"]`);
		if (!current || !target) return;
		const before = wordBoxes(current);
		const after = wordBoxes(target);
		const index = after.findIndex((box, i) => box && before[i]
			&& Math.abs(box.top - before[i].top) > box.height / 2);
		const lineHeight = parseFloat(getComputedStyle(target.querySelector("p") ?? target).lineHeight);
		setMoved(index < 0 ? undefined : { index, line: 1 + Math.round((after[index].top - after[0].top) / lineHeight) });
		setInteracted(true);
		setMode(next);
	};

	useEffect(() => {
		const root = stage.current;
		const marker = ribbon.current;
		const layer = root?.querySelector<HTMLElement>(`[data-layer="${mode}"]`);
		const text = layer?.querySelector("p");
		if (!root || !marker || !layer || !text) return;
		let frame = 0;
		const position = () => {
			const boxes = wordBoxes(layer);
			const first = boxes[0];
			if (!first) return;
			const anchor = moved
				? boxes[moved.index]
				: boxes.filter((box) => box && Math.abs(box.top - first.top) < first.height / 2).at(-1);
			if (!anchor) return;
			const origin = root.getBoundingClientRect();
			const roomAtEnd = anchor.right + marker.offsetWidth + 8 <= origin.right;
			const beside = !moved && roomAtEnd;
			const edge = beside ? anchor.right + 8 : anchor.left + (anchor.width - marker.offsetWidth) / 2;
			const x = Math.max(0, Math.min(edge - origin.left, origin.width - marker.offsetWidth));
			const bottom = beside ? anchor.bottom - marker.offsetHeight * 0.7 : text.getBoundingClientRect().bottom + 8;
			const y = bottom - origin.top;
			marker.style.setProperty("--ribbon-x", `${x}px`);
			marker.style.setProperty("--ribbon-y", `${y}px`);
			marker.dataset.positioned = "";
		};
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(position);
		};
		const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
		resize?.observe(root);
		const mutation = new MutationObserver(schedule);
		mutation.observe(layer, { childList: true, subtree: true });
		document.fonts?.addEventListener("loadingdone", schedule);
		schedule();
		return () => {
			resize?.disconnect();
			mutation.disconnect();
			document.fonts?.removeEventListener("loadingdone", schedule);
			cancelAnimationFrame(frame);
		};
	}, [mode, moved, width]);

	const sample = (layer: Mode) => words.map((word, index) => (
		<Fragment key={word}>
			{index > 0 && " "}
			<span data-word={index} data-moved={mode === layer && moved?.index === index ? "" : undefined}>{word}</span>
		</Fragment>
	));

	return (
		<section className="specimen" id="playground" aria-label="줄바꿈 비교">
			<div className="specimen-stage" ref={stage} style={{ "--specimen-width": `${width}em` } as CSSProperties}>
				<div className="specimen-layer" data-layer="css" aria-hidden={mode !== "css"}>
					<p className="specimen-text">{sample("css")}</p>
				</div>
				<div className="specimen-layer" data-layer="kowrap" aria-hidden={mode !== "kowrap"}>
					<WrapText as="p" className="specimen-text" style={{ textWrap: "wrap" }}>{sample("kowrap")}</WrapText>
				</div>
				<span className="specimen-ribbon" ref={ribbon} aria-hidden="true" data-interacted={interacted ? "" : undefined} />
			</div>
			<p className="sr-only" role="status">{moved ? `${moved.line}번째 줄로 이동한 어절은 ‘${words[moved.index]}’입니다.` : ""}</p>
			<div className="specimen-controls">
				<div className="specimen-width">
					<label htmlFor="specimen-width">너비</label>
					<input id="specimen-width" type="range" min="8" max="13" step="0.25" value={width}
						onChange={(event) => {
							setMoved(undefined);
							setInteracted(true);
							setWidth(Number(event.target.value));
						}} />
					<output htmlFor="specimen-width">{width} em</output>
				</div>
				<div className="specimen-modes" role="group" aria-label="줄바꿈 방식">
					{modes.map(([value, label]) => (
						<Button key={value} variant={mode === value ? "primary" : "ghost"} size="sm"
							aria-pressed={mode === value} onClick={() => changeMode(value)}>{label}</Button>
					))}
				</div>
				<a href="#editor" className="specimen-edit" onClick={() => {
					const editor = document.getElementById("editor");
					if (editor instanceof HTMLDetailsElement) editor.open = true;
				}}>직접 편집 <span aria-hidden="true">↘</span></a>
			</div>
		</section>
	);
};
