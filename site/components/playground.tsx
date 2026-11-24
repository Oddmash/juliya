"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { splitLines } from "@oddmash/kowrap";
import { WrapText } from "@oddmash/kowrap/react";
import { Button } from "@oddmash/ui/button";
import { Card } from "@oddmash/ui/card";
import { Textarea } from "@oddmash/ui/textarea";
import { CopyButton } from "./copy-button";

const presets = [
	{
		label: "제목",
		value: "좋은 글은 보기 편한 화면에서 시작됩니다.",
	},
	{
		label: "설명",
		value:
			"작은 화면에서도 읽는 흐름을 잃지 않도록 문장과 어절을 고려해 자연스럽게 줄을 바꿉니다.",
	},
	{
		label: "혼합 문장",
		value:
			"React와 TypeScript로 만든 서비스에 kowrap을 적용해 한국어 UI의 읽기 경험을 개선하세요.",
	},
];

const defaultMessage = "원하는 위치에 커서를 놓고 줄바꿈을 지정할 수 있어요.";
const nativeStyle = {
	display: "block",
	whiteSpace: "pre-wrap",
	wordBreak: "keep-all",
	overflowWrap: "anywhere",
} as const;

const PreviewCode = ({ code, applied }: { code: string; applied: boolean }) => (
	<details className="compare-code">
		<summary>{applied ? "kowrap 적용 코드" : "기본 CSS 코드"}</summary>
		<div className="compare-code-header">
			<CopyButton value={code} />
		</div>
		<pre>
			<code>{code}</code>
		</pre>
	</details>
);

const rowsOf = (element: HTMLElement | null) => {
	if (!element) return null;
	const height = Number.parseFloat(getComputedStyle(element).lineHeight);
	if (!Number.isFinite(height) || height <= 0) return null;
	return Math.max(
		1,
		Math.round(element.getBoundingClientRect().height / height),
	);
};

export const Playground = () => {
	const [text, setText] = useState(presets[0].value);
	const [preset, setPreset] = useState(0);
	const [width, setWidth] = useState(320);
	const [font, setFont] = useState(24);
	const [breaks, setBreaks] = useState<number[]>([]);
	const [message, setMessage] = useState(defaultMessage);
	const [invalidBreak, setInvalidBreak] = useState(false);
	const [counts, setCounts] = useState<{
		native: number | null;
		kowrap: number | null;
		actualWidth: number | null;
	}>({ native: null, kowrap: null, actualWidth: null });
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const nativeRef = useRef<HTMLParagraphElement>(null);
	const kowrapRef = useRef<HTMLDivElement>(null);
	const previewStyle = useMemo<CSSProperties>(
		() => ({
			width,
			maxWidth: "100%",
			fontSize: font,
			fontWeight: 650,
			lineHeight: 1.55,
			letterSpacing: "-.037em",
		}),
		[width, font],
	);
	const comparisonStyle = {
		"--demo-width": `${width}px`,
		"--demo-font": `${font}px`,
	} as CSSProperties;

	useEffect(() => {
		const native = nativeRef.current;
		const container = kowrapRef.current;
		if (!native || !container) return;
		let frame = 0;
		const update = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const result = {
					native: rowsOf(native),
					kowrap: rowsOf(container.querySelector("p")),
					actualWidth: Math.round(native.getBoundingClientRect().width),
				};
				setCounts((previous) =>
					previous.native === result.native && previous.kowrap === result.kowrap && previous.actualWidth === result.actualWidth
						? previous
						: result,
				);
			});
		};
		const resize =
			typeof ResizeObserver === "undefined"
				? undefined
				: new ResizeObserver(update);
		resize?.observe(native);
		resize?.observe(container);
		const mutation = new MutationObserver(update);
		mutation.observe(container, {
			childList: true,
			subtree: true,
			characterData: true,
		});
		update();
		return () => {
			resize?.disconnect();
			mutation.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [text, width, font, breaks]);

	const changeText = (value: string, selected = -1) => {
		setText(value);
		setPreset(selected);
		setBreaks([]);
		setMessage(defaultMessage);
		setInvalidBreak(false);
	};
	const addBreak = () => {
		const position = inputRef.current?.selectionStart ?? 0;
		const next = [...new Set([...breaks, position])].sort((a, b) => a - b);
		try {
			splitLines(text, next);
			setBreaks(next);
			setMessage(`강제 개행 ${next.length}개 (위치 ${next.join(", ")})`);
			setInvalidBreak(false);
		} catch {
			setMessage("문장 내부의 유효한 글자 경계에 커서를 놓아 주세요.");
			setInvalidBreak(true);
		}
	};
	const clearBreaks = () => {
		setBreaks([]);
		setMessage(defaultMessage);
		setInvalidBreak(false);
	};
	const styleCode = `const style = {\n  width: ${width}, maxWidth: "100%", fontSize: ${font},\n  fontWeight: 650, lineHeight: 1.55,\n  letterSpacing: "-.037em",\n};`;
	const textCode = `const text = ${JSON.stringify(text)};`;
	const withoutCode = `${textCode}\n${styleCode}\n\n<p style={{ ...style, whiteSpace: "pre-wrap",\n  wordBreak: "keep-all", overflowWrap: "anywhere" }}>\n  {text}\n</p>`;
	const withCode = `import { WrapText } from "@oddmash/kowrap/react";\n\n${textCode}\n${styleCode}\n\n<WrapText as="p" style={style}${breaks.length ? ` forcedBreaks={${JSON.stringify(breaks)}}` : ""}>\n  {text}\n</WrapText>`;

	return (
		<section
			id="comparison-editor"
			className="playground"
			aria-labelledby="playground-title"
		>
			<div className="playground-header">
				<div>
					<h3 id="playground-title">내 문장으로 비교하기</h3>
				</div>
				<div className="control-range comparison-width">
					<label htmlFor="demo-width">
						비교 폭 <output htmlFor="demo-width">{width}px</output>
					</label>
					<input
						id="demo-width"
						type="range"
						min="180"
						max="460"
						step="4"
						value={width}
						onChange={(event) => setWidth(Number(event.target.value))}
					/>
					{counts.actualWidth !== null && <span className="actual-width">실제 비교 폭: {counts.actualWidth}px{counts.actualWidth < width ? " (화면 폭에 맞춤)" : ""}</span>}
				</div>
			</div>
			<div className="playground-body">
				<div className="playground-settings">
					<div className="editor">
						<label htmlFor="demo-text">
							비교할 문장
						</label>
						<Textarea
							id="demo-text"
							rows={2}
							maxLength={400}
							spellCheck={false}
							name="text"
							ref={inputRef}
							value={text}
							onChange={(event) => changeText(event.target.value)}
						/>
						<details className="editor-advanced">
							<summary>고급 설정: 강제 개행</summary>
							<div className="editor-actions">
							<Button variant="secondary" size="sm" type="button" className="button-small" onClick={addBreak}>
								커서 위치에서 개행
							</Button>
							<Button variant="secondary" size="sm"
								type="button"
								className="button-small"
								onClick={clearBreaks}
								disabled={!breaks.length}
							>
								개행 초기화
							</Button>
							<span
								className={`editor-status${invalidBreak ? " is-error" : ""}`}
								role="status"
							>
								{message}
							</span>
							</div>
						</details>
					</div>
					<div className="controls">
						<div className="preset-group" role="group" aria-label="예시 문장">
							{presets.map(({ label, value }, index) => (
								<Button variant={preset === index ? "primary" : "secondary"} size="sm"
									type="button"
									key={label}
									className={`preset ${preset === index ? "is-active" : ""}`}
									aria-pressed={preset === index}
									onClick={() => changeText(value, index)}
								>
									{label}
								</Button>
							))}
						</div>
						<div className="control-range font-control">
							<label htmlFor="font-size">
								글자 크기 <output htmlFor="font-size">{font}px</output>
							</label>
							<input
								id="font-size"
								type="range"
								min="16"
								max="32"
								value={font}
								onChange={(event) => setFont(Number(event.target.value))}
							/>
						</div>
					</div>
				</div>
					<div className="comparison" style={comparisonStyle}>
					<Card role="article" className="comparison-card">
						<div className="comparison-top">
							<span className="comparison-label">
								<span className="marker marker-neutral" />
								적용 전 (CSS keep-all)
							</span>
							<span className="line-count">
								{counts.native === null ? "측정 중" : `${counts.native}줄`}
							</span>
						</div>
						<div className="preview-stage">
							<div className="preview-ruler" aria-hidden="true"><span /></div>
							<p
								id="native-preview"
								ref={nativeRef}
								className="preview-text"
								style={{ ...previewStyle, ...nativeStyle }}
							>
								{text}
							</p>
						</div>
						<PreviewCode code={withoutCode} applied={false} />
					</Card>
					<Card role="article" className="comparison-card comparison-featured">
						<div className="comparison-top">
							<span className="comparison-label">
								<span className="marker marker-active" />
								적용 후 (kowrap)
							</span>
							<span className="line-count">
								{counts.kowrap === null ? "측정 중" : `${counts.kowrap}줄`}
							</span>
						</div>
						<div className="preview-stage" ref={kowrapRef}>
							<div className="preview-ruler" aria-hidden="true"><span /></div>
							<WrapText
								as="p"
								id="kowrap-preview"
								className="preview-text"
								style={previewStyle}
								forcedBreaks={breaks}
							>
								{text}
							</WrapText>
						</div>
						<PreviewCode code={withCode} applied />
					</Card>
				</div>
			<div className="playground-footer">
					<span>
						{breaks.length
							? "강제 개행은 kowrap에만 적용됩니다."
							: "같은 글꼴과 폭에서 실제 브라우저 CSS와 kowrap을 비교합니다."}
					</span>
					<Link href="/docs/core/">코어 API</Link>
				</div>
			</div>
		</section>
	);
};
