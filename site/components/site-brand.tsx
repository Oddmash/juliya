"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { landingCopy, languageFromPath, languagePath } from "../lib/locales";

const homeLabels = { ko: "줄이야 홈", en: "Juliya home", ja: "Juliya ホーム", zh: "Juliya 首页" };

export const SiteBrand = ({ children, version }: { children: ReactNode; version?: string }) => {
	const locale = languageFromPath(usePathname() ?? "/");
	return (
		<Link className="brand" href={`${languagePath(locale)}/`} aria-label={homeLabels[locale]}>
			{children}
			<span className="brand-name">{landingCopy[locale].title}</span>
			{version && <span className="version">v{version}</span>}
		</Link>
	);
};
