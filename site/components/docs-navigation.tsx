"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DocsNavigation as SharedDocsNavigation } from "@oddmash/ui/docs-navigation";
import type { SiteLocale } from "../lib/locales";
import { landingCopy } from "../lib/locales";

interface Item {
	slug: string;
	href: string;
	title: string;
	group: string;
}

const browseLabels = { ko: "문서 목록", en: "Browse documentation", ja: "ドキュメントを一覧表示", zh: "浏览文档" };
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const DocsNavigation = ({ items, current, locale = "ko" }: {
	items: Item[];
	current: string;
	locale?: SiteLocale;
}) => {
	const router = useRouter();
	const groups = useMemo(() => [...new Set(items.map(item => item.group))].map(group => ({
		id: group,
		label: group,
		items: items.filter(item => item.group === group).map(item => ({ id: item.slug, href: basePath + item.href, label: item.title })),
	})), [items]);
	return (
		<SharedDocsNavigation className="docs-sidebar" aria-label={landingCopy[locale].docs}
			groups={groups} currentId={current} mobileLabel={browseLabels[locale]}
			onNavigate={(item, event) => {
				event.preventDefault();
				router.push(item.href.slice(basePath.length));
			}} />
	);
};
