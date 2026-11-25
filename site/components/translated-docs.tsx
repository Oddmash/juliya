import Link from "next/link";
import { DocsNavigation } from "./docs-navigation";
import { Prose } from "@oddmash/ui/prose";
import { CodeBlock, CodeBlockHeader, CodeBlockCaption, CodeBlockContent } from "@oddmash/ui/code-block";
import { CopyButton } from "./copy-button";
import { engineLocale, landingCopy, languagePath } from "../lib/locales";
import type { SiteLocale } from "../lib/locales";
import { translatedGuides } from "../lib/translated-guides";
import { JuliyaProvider, JuliyaText } from "@oddmash/juliya/react";

const referenceLabel = { en: "Full reference (Korean)", ja: "詳細リファレンス（韓国語）", zh: "完整参考（韩语）" };
export const TranslatedDocs = ({ locale, slug }: { locale: Exclude<SiteLocale, "ko">; slug: string }) => {
	const guides = translatedGuides(locale);
	const guide = guides.find(item => item.slug === slug)!;
	const lang = engineLocale(locale);
	return <main id="main" lang={lang} className="container docs-shell">
		<DocsNavigation locale={locale} items={guides} current={slug} />
		<Prose className="docs-content">
			<p className="docs-breadcrumb"><Link href={`${languagePath(locale)}/`}>Juliya</Link><span>/</span>{landingCopy[locale].docs}</p>
			<JuliyaProvider locale={lang}>
				<JuliyaText as="h1">{guide.title}</JuliyaText>
				<JuliyaText as="p">{guide.body}</JuliyaText>
			</JuliyaProvider>
			<CodeBlock className="doc-code"><CodeBlockHeader className="doc-code-head"><CodeBlockCaption>{guide.format}</CodeBlockCaption><CopyButton value={guide.snippet} icon /></CodeBlockHeader><CodeBlockContent><code>{guide.snippet}</code></CodeBlockContent></CodeBlock>
			<p><Link href={slug === "start" ? "/docs/" : `/docs/${slug}/`}>{referenceLabel[locale]}</Link></p>
			<div className="docs-bottom"><Link href={`${languagePath(locale)}/#editor`}>{landingCopy[locale].try}</Link></div>
		</Prose>
	</main>;
};
