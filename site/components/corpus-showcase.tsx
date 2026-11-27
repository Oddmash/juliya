"use client";

import Link from "next/link";
import { useState } from "react";
import { JuliyaText } from "@oddmash/juliya/react";
import { Card } from "@oddmash/ui/card";
import { Slider } from "@oddmash/ui/slider";
import { SelectDropdown } from "@oddmash/ui/select";
import { corpusCopy } from "../lib/corpus-copy";
import { engineLocale, languageNames, languagePath, languages, type SiteLocale } from "../lib/locales";
import type { CorpusFixture } from "../lib/corpus";
import "../app/corpus.css";

export const CorpusShowcase = ({ locale, samples }: { locale: SiteLocale; samples: CorpusFixture[] }) => {
	const copy = corpusCopy[locale];
	const [language, setLanguage] = useState(locale);
	const [width, setWidth] = useState(260);
	const sample = samples.find(item => item.locale === language) ?? samples[0];
	const lang = engineLocale(language);
	const previewStyle = { width, maxWidth: "100%", fontSize: "1.125rem", lineHeight: 1.75, margin: 0 } as const;
	return (
		<section id="corpus-showcase" className="landing-capabilities corpus-showcase" aria-labelledby="corpus-title">
			<div className="landing-section-heading">
				<p className="section-label">{copy.eyebrow}</p>
				<h2 id="corpus-title">{copy.heading}</h2>
				<p>{copy.description}</p>
			</div>
			<div className="corpus-controls">
				<div className="control-range">
					<label htmlFor="corpus-language">{copy.textLanguage}</label>
					<SelectDropdown id="corpus-language" value={language} options={languages.map(value => ({ value, label: languageNames[value] }))} onValueChange={value => setLanguage(value as SiteLocale)} />
				</div>
				<div className="control-range">
					<label htmlFor="corpus-width">{copy.width} <output htmlFor="corpus-width">{width}px</output></label>
					<Slider id="corpus-width" min="160" max="420" step="4" value={width} onChange={event => setWidth(Number(event.target.value))} />
				</div>
			</div>
			<p className="corpus-hint">{copy.widthHint}</p>
			<p className="corpus-credit"><cite lang={lang}>{sample.title}</cite> · <span lang={lang}>{sample.author}</span> · {sample.publication}</p>
			<div className="comparison corpus-comparison">
				<Card role="article" className="comparison-card">
					<div className="comparison-top"><span className="comparison-label">{copy.native}</span></div>
					<div className="preview-stage"><p id="corpus-native" lang={lang} style={{ ...previewStyle, whiteSpace: "pre-wrap", wordBreak: "normal", overflowWrap: "anywhere" }}>{sample.text}</p></div>
				</Card>
				<Card role="article" className="comparison-card comparison-featured">
					<div className="comparison-top"><span className="comparison-label">Juliya</span></div>
					<div className="preview-stage"><JuliyaText key={sample.id} as="p" id="corpus-juliya" locale={lang} lang={lang} style={previewStyle}>{sample.text}</JuliyaText></div>
				</Card>
			</div>
			<p className="corpus-hint">{sample.attribution} · {sample.license} · {sample.transformation} {sample.source && <a href={sample.source}>{copy.source}</a>} {sample.license?.includes("CC BY-SA") && <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>}</p>
			<Link className="text-link" href={languagePath(locale) + "/corpus/"}>{copy.explore}</Link>
		</section>
	);
};
