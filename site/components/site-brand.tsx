import Link from "next/link";
import type { ReactNode } from "react";
import { landingCopy, languagePath, type SiteLocale } from "../lib/locales";

const homeLabels = { ko: "줄이야 홈", en: "Juliya home", ja: "Juliya ホーム", zh: "Juliya 首页" };

export const SiteBrand = ({ children, locale, version }: { children: ReactNode; locale: SiteLocale; version?: string }) => {
	return (
		<Link className="brand" href={`${languagePath(locale)}/`} aria-label={homeLabels[locale]}>
			{children}
			<span className="brand-name">{landingCopy[locale].title}</span>
			{version && <span className="version">v{version}</span>}
		</Link>
	);
};
