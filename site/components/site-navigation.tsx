"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { HeaderSearch } from "./header-search";
import { SelectDropdown as Select } from "@oddmash/ui/select";
import { engineLocale, landingCopy, languageFromPath, languageNames, languagePath, languages } from "../lib/locales";
import type { SiteLocale } from "../lib/locales";
import { translatedGuides } from "../lib/translated-guides";
import { repositoryUrl } from "../lib/project";

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
		router.push(languagePath(next) + target + window.location.hash);
	};
	return <nav className="nav-links" aria-label={locale === "ko" ? "주 메뉴" : copy.docs}>
		<HeaderSearch items={locale === "ko" ? items : translatedGuides(locale)} locale={locale} />
		<Link href={`${prefix}/docs/`}>{copy.docs}</Link>
		<Select
			className="language-select"
			aria-label={{ ko: "언어", en: "Language", ja: "言語", zh: "语言" }[locale]}
			options={languages.map(language => ({ value: language, label: languageNames[language] }))}
			value={locale}
			onValueChange={value => switchLanguage(value as SiteLocale)}
		/>
		<a className="desktop-link" href={repositoryUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
	</nav>;
};
