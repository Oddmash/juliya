import { notFound } from "next/navigation";
import { CorpusPage } from "../../../components/corpus-page";
import { corpusCopy } from "../../../lib/corpus-copy";
import { languages, type SiteLocale } from "../../../lib/locales";

export const dynamicParams = false;
export const generateStaticParams = () => languages.filter(language => language !== "ko").map(language => ({ language }));
export const generateMetadata = async ({ params }: { params: Promise<{ language: string }> }) => {
	const { language } = await params;
	if (!languages.includes(language as SiteLocale) || language === "ko") return {};
	const copy = corpusCopy[language as SiteLocale];
	return { title: copy.pageTitle, description: copy.pageDescription };
};
const Page = async ({ params }: { params: Promise<{ language: string }> }) => {
	const { language } = await params;
	if (language === "ko" || !languages.includes(language as SiteLocale)) notFound();
	return <CorpusPage locale={language as SiteLocale} />;
};
export default Page;
