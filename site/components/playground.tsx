"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { splitLines } from "@oddmash/kowrap";
import type { WrapLocale } from "@oddmash/kowrap";
import { JuliyaText } from "@oddmash/kowrap/react";
import { Button } from "@oddmash/ui/button";
import { Card } from "@oddmash/ui/card";
import { Textarea } from "@oddmash/ui/textarea";
import { SelectDropdown as Select } from "@oddmash/ui/select";
import { CopyButton } from "./copy-button";

const koreanPresets = [
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
			"React와 TypeScript로 만든 서비스에 줄이야를 적용해 한국어 UI의 읽기 경험을 개선하세요.",
	},
];
const languageSamples = {
	ko: koreanPresets,
	en: [{ label: "Title", value: "Build a better experience for everyone." }, { label: "Description", value: "Keep related words together when they fit on the same line." }, { label: "Mixed", value: "Build better React applications with TypeScript." }],
	ja: [{ label: "タイトル", value: "読みやすい文章を、もっと自然に。" }, { label: "説明", value: "画面の幅に合わせて、自然な位置で改行します。" }, { label: "混在", value: "ReactとTypeScriptで快適な画面を作る。" }],
	"zh-Hans": [{ label: "标题", value: "让每一句话都读起来更加自然。" }, { label: "说明", value: "根据屏幕宽度调整换行，保持句子流畅。" }, { label: "混合", value: "使用 React 和 TypeScript 构建更好的界面。" }],
} as const;
type DemoLocale = keyof typeof languageSamples;
const playgroundCopy = {
	ko: { language: "문장 언어", width: "비교 폭", actual: "실제 비교 폭", text: "비교할 문장", advanced: "고급 설정: 강제 개행", add: "커서 위치에서 개행", reset: "개행 초기화", example: "예시 문장", font: "글자 크기", native: "기본 CSS", measuring: "측정 중", lines: "줄", forced: "강제 개행은 줄이야에만 적용됩니다.", core: "코어 API", hint: "원하는 위치에 커서를 놓고 줄바꿈을 지정할 수 있어요.", error: "문장 내부의 유효한 글자 경계에 커서를 놓아 주세요.", breakCount: "강제 개행", appliedCode: "줄이야 적용 코드", nativeCode: "기본 CSS 코드" },
	en: { language: "Text language", width: "Width", actual: "Actual width", text: "Text to compare", advanced: "Advanced: forced breaks", add: "Break at cursor", reset: "Clear breaks", example: "Examples", font: "Font size", native: "Native CSS", measuring: "Measuring", lines: " lines", forced: "Forced breaks apply only to Juliya.", core: "Core API", hint: "Place the cursor where you want a line break.", error: "Choose a valid character boundary inside the text.", breakCount: "Forced breaks", appliedCode: "Juliya code", nativeCode: "CSS code" },
	ja: { language: "文章の言語", width: "比較幅", actual: "実際の幅", text: "比較する文章", advanced: "詳細設定: 強制改行", add: "カーソル位置で改行", reset: "改行を解除", example: "例文", font: "文字サイズ", native: "標準 CSS", measuring: "測定中", lines: "行", forced: "強制改行はJuliyaのみに適用されます。", core: "コア API", hint: "改行する位置にカーソルを置いてください。", error: "文章内の有効な文字境界を選択してください。", breakCount: "強制改行", appliedCode: "Juliya コード", nativeCode: "CSS コード" },
	"zh-Hans": { language: "文本语言", width: "比较宽度", actual: "实际宽度", text: "比较文本", advanced: "高级设置：强制换行", add: "在光标处换行", reset: "清除换行", example: "示例文本", font: "字号", native: "原生 CSS", measuring: "测量中", lines: "行", forced: "强制换行仅适用于 Juliya。", core: "核心 API", hint: "将光标放在需要换行的位置。", error: "请选择文本中的有效字符边界。", breakCount: "强制换行", appliedCode: "Juliya 代码", nativeCode: "CSS 代码" },
};

const nativeStyle = {
	display: "block",
	whiteSpace: "pre-wrap",
	wordBreak: "keep-all",
	overflowWrap: "anywhere",
} as const;

const PreviewCode = ({ code, label }: { code: string; label: string }) => (
	<details className="compare-code">
		<summary>{label}</summary>
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

export const Playground = ({ initialLocale = "ko" }: { initialLocale?: DemoLocale }) => {
	const copy = playgroundCopy[initialLocale];
	const [locale, setLocale] = useState<DemoLocale>(initialLocale);
	const presets = languageSamples[locale];
	const [text, setText] = useState<string>(languageSamples[initialLocale][0].value);
	const [preset, setPreset] = useState(0);
	const [width, setWidth] = useState(320);
	const [font, setFont] = useState(24);
	const [breaks, setBreaks] = useState<number[]>([]);
	const [message, setMessage] = useState(copy.hint);
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
	}, [text, width, font, breaks, locale]);

	const changeText = (value: string, selected = -1) => {
		setText(value);
		setPreset(selected);
		setBreaks([]);
		setMessage(copy.hint);
		setInvalidBreak(false);
	};
	const addBreak = () => {
		const position = inputRef.current?.selectionStart ?? 0;
		const next = [...new Set([...breaks, position])].sort((a, b) => a - b);
		try {
			splitLines(text, next);
			setBreaks(next);
			setMessage(`${copy.breakCount}: ${next.length} (${next.join(", ")})`);
			setInvalidBreak(false);
		} catch {
			setMessage(copy.error);
			setInvalidBreak(true);
		}
	};
	const clearBreaks = () => {
		setBreaks([]);
		setMessage(copy.hint);
		setInvalidBreak(false);
	};
	const styleCode = `const style = {\n  width: ${width}, maxWidth: "100%", fontSize: ${font},\n  fontWeight: 650, lineHeight: 1.55,\n  letterSpacing: "-.037em",\n};`;
	const textCode = `const text = ${JSON.stringify(text)};`;
	const withoutCode = `${textCode}\n${styleCode}\n\n<p style={{ ...style, whiteSpace: "pre-wrap",\n  wordBreak: "keep-all", overflowWrap: "anywhere" }}>\n  {text}\n</p>`;
	const withCode = `import { JuliyaText } from "@oddmash/kowrap/react";\n\n${textCode}\n${styleCode}\n\n<JuliyaText as="p" locale="${locale}" style={style}${breaks.length ? ` forcedBreaks={${JSON.stringify(breaks)}}` : ""}>\n  {text}\n</JuliyaText>`;

	return (
		<section
			id="comparison-editor"
			className="playground"
			aria-labelledby="playground-title"
		>
			<div className="playground-header">
				<label htmlFor="demo-locale">{copy.language}</label>
				<Select
					id="demo-locale"
					value={locale}
					options={[
						{ value: "ko", label: "한국어" },
						{ value: "en", label: "English" },
						{ value: "ja", label: "日本語" },
						{ value: "zh-Hans", label: "简体中文" },
					]}
					onValueChange={value => {
						const next = value as DemoLocale;
						setLocale(next);
						changeText(languageSamples[next][0].value, 0);
					}}
				/>
				<div className="control-range comparison-width">
					<label htmlFor="demo-width">
						{copy.width} <output htmlFor="demo-width">{width}px</output>
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
					{counts.actualWidth !== null && counts.actualWidth < width && <span className="actual-width">{copy.actual}: {counts.actualWidth}px</span>}
				</div>
			</div>
			<div className="playground-body">
				<div className="playground-settings">
					<div className="editor">
						<label htmlFor="demo-text">
							{copy.text}
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
							<summary>{copy.advanced}</summary>
							<div className="editor-actions">
							<Button variant="secondary" size="sm" type="button" className="button-small" onClick={addBreak}>
								{copy.add}
							</Button>
							<Button variant="secondary" size="sm"
								type="button"
								className="button-small"
								onClick={clearBreaks}
								disabled={!breaks.length}
							>
								{copy.reset}
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
						<div className="preset-group" role="group" aria-label={copy.example}>
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
								{copy.font} <output htmlFor="font-size">{font}px</output>
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
								{copy.native}
							</span>
							<span className="line-count">
								{counts.native === null ? copy.measuring : `${counts.native}${copy.lines}`}
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
						<PreviewCode code={withoutCode} label={copy.nativeCode} />
					</Card>
					<Card role="article" className="comparison-card comparison-featured">
						<div className="comparison-top">
							<span className="comparison-label">
								<span className="marker marker-active" />
								Juliya
							</span>
							<span className="line-count">
								{counts.kowrap === null ? copy.measuring : `${counts.kowrap}${copy.lines}`}
							</span>
						</div>
						<div className="preview-stage" ref={kowrapRef}>
							<div className="preview-ruler" aria-hidden="true"><span /></div>
							<JuliyaText
								as="p"
								id="kowrap-preview"
								locale={locale as WrapLocale}
								lang={locale}
								className="preview-text"
								style={previewStyle}
								forcedBreaks={breaks}
							>
								{text}
							</JuliyaText>
						</div>
						<PreviewCode code={withCode} label={copy.appliedCode} />
					</Card>
				</div>
			<div className="playground-footer">
					<span>
						{breaks.length
							? copy.forced
							: null}
					</span>
					<Link href={initialLocale === "ko" ? "/docs/core/" : `/${initialLocale === "zh-Hans" ? "zh" : initialLocale}/docs/`}>{copy.core}</Link>
				</div>
			</div>
		</section>
	);
};
