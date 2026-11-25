"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { HeaderSearch } from "./header-search";
import { LocalePicker } from "@oddmash/ui/locale-picker";
import { SiteNav } from "@oddmash/ui/site-layout";
import { PlatformLink, PlatformLinks } from "@oddmash/ui/platform-link";
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
	const destination = (next: SiteLocale) => {
		const suffix = prefix ? pathname.slice(prefix.length) || "/" : pathname;
		const target = suffix.startsWith("/docs") ? suffix : "/";
		return languagePath(next) + target;
	};
	return <SiteNav className="nav-links" aria-label={locale === "ko" ? "주 메뉴" : copy.docs}>
		<HeaderSearch items={locale === "ko" ? items : translatedGuides(locale)} locale={locale} />
		<Link href={`${prefix}/docs/`}>{copy.docs}</Link>
		<LocalePicker
			selectProps={{ className: "language-select" }}
			label={{ ko: "언어", en: "Language", ja: "言語", zh: "语言" }[locale]}
			options={languages.map(language => ({ value: language, label: languageNames[language], lang: engineLocale(language), href: (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + destination(language) }))}
			value={locale}
			onValueChange={value => router.push(destination(value as SiteLocale) + window.location.hash)}
		/>
		<PlatformLinks className="desktop-link">
			<PlatformLink platform="github" href={repositoryUrl} aria-label="GitHub" title="GitHub" target="_blank" rel="noopener noreferrer" />
			<PlatformLink platform="npm" href="https://www.npmjs.com/package/@oddmash/juliya" aria-label="npm" title="npm" target="_blank" rel="noopener noreferrer" />
		</PlatformLinks>
	</SiteNav>;
};
