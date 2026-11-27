"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HeaderSearch } from "./header-search";
import { ButtonLink } from "@oddmash/ui/button";
import type { ButtonLinkProps } from "@oddmash/ui/button";
import { LocalePicker } from "@oddmash/ui/locale-picker";
import { SiteNav } from "@oddmash/ui/site-layout";
import { PlatformLink, PlatformLinks } from "@oddmash/ui/platform-link";
import { engineLocale, landingCopy, languageNames, languagePath, languages } from "../lib/locales";
import type { SiteLocale } from "../lib/locales";
import { translatedGuides } from "../lib/translated-guides";
import { repositoryUrl } from "../lib/project";

interface Item { slug: string; title: string; group: string; body: string; href: string }
export const SiteButtonLink = ({ href, onClick, ...props }: ButtonLinkProps) => {
	const router = useRouter();
	return <ButtonLink {...props} href={(process.env.NEXT_PUBLIC_BASE_PATH ?? "") + href}
		onClick={event => {
			onClick?.(event);
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || (props.target && props.target !== "_self") || props.download != null) return;
			event.preventDefault();
			router.push(href);
		}} />;
};

export const SiteNavigation = ({ items, locale }: { items: Item[]; locale: SiteLocale }) => {
	const pathname = usePathname() ?? "/";
	const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
	const copy = landingCopy[locale];
	const prefix = languagePath(locale);
	const destination = (next: SiteLocale) => {
		const suffix = prefix ? pathname.slice(prefix.length) || "/" : pathname;
		const target = suffix.startsWith("/docs") || suffix.startsWith("/corpus") ? suffix : "/";
		return languagePath(next) + target;
	};
	return <SiteNav className="nav-links" aria-label={locale === "ko" ? "주 메뉴" : copy.docs}>
		<HeaderSearch items={locale === "ko" ? items : translatedGuides(locale)} locale={locale} />
		<Link href={`${prefix}/docs/`}>{copy.docs}</Link>
		<LocalePicker
			selectProps={{ className: "language-select" }}
			label={{ ko: "언어", en: "Language", ja: "言語", zh: "语言" }[locale]}
			options={languages.map(language => ({ value: language, label: languageNames[language], lang: engineLocale(language), href: basePath + destination(language) }))}
			value={locale}
			onValueChange={value => window.location.assign(basePath + destination(value as SiteLocale) + window.location.hash)}
		/>
		<PlatformLinks className="desktop-link">
			<PlatformLink platform="github" href={repositoryUrl} aria-label="GitHub" title="GitHub" target="_blank" rel="noopener noreferrer" />
			<PlatformLink platform="npm" href="https://www.npmjs.com/package/@oddmash/juliya" aria-label="npm" title="npm" target="_blank" rel="noopener noreferrer" />
		</PlatformLinks>
	</SiteNav>;
};
