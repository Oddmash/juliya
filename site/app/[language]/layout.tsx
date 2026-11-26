import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { SiteDocument } from "../../components/site-document";

export { metadata } from "../../components/site-document";

export default async function LocalizedLayout({ children, params }: {
	children: ReactNode;
	params: Promise<{ language: string }>;
}) {
	const { language } = await params;
	if (language !== "en" && language !== "ja" && language !== "zh") notFound();
	return <SiteDocument locale={language}>{children}</SiteDocument>;
}
