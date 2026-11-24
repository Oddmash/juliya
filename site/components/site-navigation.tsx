"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { HeaderSearch } from "./header-search";
import { engineLocale, landingCopy, languageFromPath, languageNames, languagePath, languages } from "../lib/locales";
import type { SiteLocale } from "../lib/locales";
import { translatedGuides } from "../lib/translated-guides";

interface Item { slug: string; title: string; group: string; body: string; href: string }
export const SiteNavigation = ({ items }: { items: Item[] }) => {
	const pathname = usePathname() ?? "/";
	const router = useRouter();
	const locale = languageFromPath(pathname);
	const copy = landingCopy[locale];
	const prefix = languagePath(locale);
	useEffect(() => { document.documentElement.lang = engineLocale(locale); }, [locale]);
	const switchLanguage = (next: SiteLocale) => {
		const suffix = prefix ? pathname.slice(prefix.length) || "/" : pathname;
		const target = suffix.startsWith("/docs") ? suffix : "/";
		router.push(languagePath(next) + target);
	};
	return <nav className="nav-links" aria-label={locale === "ko" ? "주 메뉴" : copy.docs}>
		<HeaderSearch items={locale === "ko" ? items : translatedGuides(locale)} locale={locale} />
		<Link href={`${prefix}/docs/`}>{copy.docs}</Link>
		<select className="language-select" aria-label="Language / 언어" value={locale} onChange={event => switchLanguage(event.target.value as SiteLocale)}>
			{languages.map(language => <option key={language} value={language}>{languageNames[language]}</option>)}
		</select>
		<a className="desktop-link" href="https://github.com/Oddmash/kowrap" target="_blank" rel="noopener noreferrer">GitHub</a>
	</nav>;
};
