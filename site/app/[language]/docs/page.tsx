import { notFound } from "next/navigation";
import { TranslatedDocs } from "../../../components/translated-docs";
import { languages } from "../../../lib/locales";
import type { SiteLocale } from "../../../lib/locales";
import { translatedGuides } from "../../../lib/translated-guides";

export const dynamicParams = false;
export const generateStaticParams = () => languages.filter(language => language !== "ko").map(language => ({ language }));
export const generateMetadata = async ({ params }: { params: Promise<{ language: string }> }) => {
	const { language } = await params;
	if (language === "ko" || !languages.includes(language as SiteLocale)) return {};
	const guide = translatedGuides(language as Exclude<SiteLocale, "ko">)[0];
	return { title: guide?.title, description: guide?.body };
};
const Page = async ({ params }: { params: Promise<{ language: string }> }) => {
	const { language } = await params;
	if (language === "ko" || !languages.includes(language as SiteLocale)) notFound();
	return <TranslatedDocs locale={language as Exclude<SiteLocale, "ko">} slug="start" />;
};
export default Page;
