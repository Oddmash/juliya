import { notFound } from "next/navigation";
import { TranslatedDocs } from "../../../../components/translated-docs";
import { languages } from "../../../../lib/locales";
import type { SiteLocale } from "../../../../lib/locales";
import { translatedGuideSlugs, translatedGuides } from "../../../../lib/translated-guides";

export const dynamicParams = false;
export const generateStaticParams = () => languages.filter(language => language !== "ko").flatMap(language => translatedGuideSlugs.filter(slug => slug !== "start").map(slug => ({ language, slug })));
export const generateMetadata = async ({ params }: { params: Promise<{ language: string; slug: string }> }) => {
	const { language, slug } = await params;
	if (language === "ko" || !languages.includes(language as SiteLocale)) return {};
	const guide = translatedGuides(language as Exclude<SiteLocale, "ko">).find(item => item.slug === slug);
	return { title: guide?.title, description: guide?.body };
};
const Page = async ({ params }: { params: Promise<{ language: string; slug: string }> }) => {
	const { language, slug } = await params;
	if (language === "ko" || !languages.includes(language as SiteLocale) || !translatedGuideSlugs.some(item => item === slug)) notFound();
	return <TranslatedDocs locale={language as Exclude<SiteLocale, "ko">} slug={slug} />;
};
export default Page;
