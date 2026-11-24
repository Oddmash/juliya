import { notFound } from "next/navigation";
import { TranslatedLanding } from "../../components/translated-landing";
import { landingCopy, languages } from "../../lib/locales";
import type { SiteLocale } from "../../lib/locales";

export const dynamicParams = false;
export const generateStaticParams = () => languages.filter(language => language !== "ko").map(language => ({ language }));
export const generateMetadata = async ({ params }: { params: Promise<{ language: string }> }) => {
	const { language } = await params;
	if (!languages.includes(language as SiteLocale)) return {};
	const copy = landingCopy[language as SiteLocale];
	return { title: copy.title, description: copy.description };
};
const Page = async ({ params }: { params: Promise<{ language: string }> }) => {
	const { language } = await params;
	if (language === "ko" || !languages.includes(language as SiteLocale)) notFound();
	return <TranslatedLanding locale={language as SiteLocale} />;
};
export default Page;
