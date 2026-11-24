import Link from "next/link";
import { LandingSpecimen } from "./landing-specimen";
import { FrameworkExamples } from "./framework-examples";
import { Playground } from "./playground";
import { CopyButton } from "./copy-button";
import { engineLocale, landingCopy, languagePath } from "../lib/locales";
import type { SiteLocale } from "../lib/locales";
import "../app/landing.css";

export const TranslatedLanding = ({ locale }: { locale: SiteLocale }) => {
	const copy = landingCopy[locale];
	const docs = `${languagePath(locale)}/docs/`;
	const command = "pnpm add @oddmash/kowrap";
	return (
		<main id="main" lang={engineLocale(locale)} className="container landing">
			<header className="landing-intro">
				<LandingSpecimen key={locale} initialLocale={locale} />
				<div className="hero-copy">
					<h1 id="hero-title">{copy.title}</h1><p className="hero-description">{copy.description}</p>
					<div className="hero-actions"><Link className="button button-primary" href={docs}>{copy.start}</Link><a className="button hero-secondary" href="#editor">{copy.try}</a></div>
				</div>
				<a className="hero-scroll" href="#install" aria-label={copy.start}><span aria-hidden="true" /></a>
			</header>
			<section id="install" className="landing-install">
				<div className="section-copy"><h2>{copy.install}</h2><p>{copy.installDescription}</p><div className="install-command"><span className="command-prefix">$</span><code>{command}</code><CopyButton value={command} className="icon-button" icon /></div></div>
				<FrameworkExamples key={locale} locale={locale} />
			</section>
			<section id="editor" className="landing-editor" tabIndex={-1}>
				<div className="landing-section-heading"><h2 id="playground-title">{copy.editor}</h2><p>{copy.editorDescription}</p></div><Playground key={locale} initialLocale={engineLocale(locale)} />
			</section>
			<section className="landing-capabilities"><h2>{copy.capabilities}</h2><div className="capability-grid">
				<article><code>&lt;strong&gt; &lt;a&gt;</code><h3>{copy.markup}</h3><p>{copy.markupDescription}</p><Link href={docs}>{copy.docs}</Link></article>
				<article><code>width: 320px</code><h3>{copy.responsive}</h3><p>{copy.responsiveDescription}</p><Link href={docs}>{copy.docs}</Link></article>
				<article><code>SSR + CSR</code><h3>{copy.ssr}</h3><p>{copy.ssrDescription}</p><Link href={docs}>{copy.docs}</Link></article>
			</div></section>
			<section className="landing-end"><h2>{copy.end}</h2><Link className="button button-primary" href={docs}>{copy.read}</Link></section>
		</main>
	);
};
