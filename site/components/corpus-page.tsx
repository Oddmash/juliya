import Link from "next/link";
import { JuliyaText } from "@oddmash/juliya/react";
import { corpusFixtures, corpusMethodUrl, type CorpusFixture } from "../lib/corpus";
import { corpusCopy } from "../lib/corpus-copy";
import { engineLocale, languageNames, languagePath, languages, type SiteLocale } from "../lib/locales";
import "../app/corpus.css";

const Fixture = ({ fixture, locale }: { fixture: CorpusFixture; locale: SiteLocale }) => {
	const copy = corpusCopy[locale];
	const lang = engineLocale(fixture.locale as SiteLocale);
	const fields = [
		[copy.author, fixture.author],
		[copy.publication, fixture.publication],
		[copy.edition, fixture.sourceEdition ?? fixture.sourceRevision],
		[copy.rights, fixture.rights],
		[copy.license, fixture.license],
		[copy.credit, fixture.attribution],
		[copy.transformation, fixture.transformation],
		[copy.date, fixture.checkedOn],
	];
	return <article id={fixture.id} className="corpus-entry">
		<p className="corpus-hint">{copy[fixture.kind === "literature" ? "literature" : "original"]} · {copy[fixture.split === "development" ? "development" : "holdout"]}</p>
		<h3 lang={lang}>{fixture.title}</h3>
		<p className="corpus-credit" lang={lang}>{fixture.author} · {fixture.publication}</p>
		<blockquote lang={lang}><JuliyaText as="p" locale={lang}>{fixture.text}</JuliyaText></blockquote>
		<details className="corpus-provenance">
			<summary>{copy.provenance}</summary>
			<dl>{fields.filter(([, value]) => value != null).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
			<ul>
				{fixture.source && <li><a href={fixture.source}>{copy.originalSource}</a></li>}
				{fixture.rightsEvidence && <li><a href={fixture.rightsEvidence}>{copy.rightsLink}</a></li>}
				{fixture.verificationSource && <li><a href={fixture.verificationSource}>{copy.verification}</a></li>}
				{fixture.license?.includes("CC BY-SA") && <li><a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></li>}
			</ul>
		</details>
	</article>;
};

export const CorpusPage = ({ locale }: { locale: SiteLocale }) => {
	const copy = corpusCopy[locale];
	const ordered = [locale, ...languages.filter(item => item !== locale)];
	return <main id="main" className="container examples-page corpus-page">
		<p className="docs-breadcrumb"><Link href={languagePath(locale) + "/"}>Juliya</Link><span aria-hidden="true">/</span><span>{copy.eyebrow}</span></p>
		<div className="examples-intro">
			<h1>{copy.pageTitle}</h1>
			<JuliyaText as="p" locale={engineLocale(locale)}>{copy.pageDescription}</JuliyaText>
		</div>
		<nav className="corpus-index" aria-label={copy.language}>
			{ordered.map(language => <a key={language} href={"#corpus-" + language} lang={engineLocale(language)}>{languageNames[language]}</a>)}
		</nav>
		<section className="corpus-method" aria-labelledby="corpus-method-title">
			<h2 id="corpus-method-title">{copy.method}</h2>
			<JuliyaText as="p" locale={engineLocale(locale)}>{copy.methodDescription}</JuliyaText>
			<JuliyaText as="p" locale={engineLocale(locale)}>{copy.results}</JuliyaText>
			<a className="text-link" href={corpusMethodUrl}>{copy.methodLink}</a>
		</section>
		{ordered.map(language => <section key={language} id={"corpus-" + language} className="corpus-language-section">
			<h2 lang={engineLocale(language)}>{languageNames[language]}</h2>
			<div className="corpus-grid">{corpusFixtures.filter(fixture => fixture.locale === language).map(fixture => <Fixture key={fixture.id} fixture={fixture} locale={locale} />)}</div>
		</section>)}
	</main>;
};
