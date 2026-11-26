import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsPage } from "../../../../components/docs-page";
import { getGuide, getGuides } from "../../../../lib/guides";

interface Props {
	params: Promise<{ slug: string }>;
}

export const dynamicParams = false;
export const generateStaticParams = () =>
	getGuides()
		.filter(({ slug }) => slug !== "start")
		.map(({ slug }) => ({ slug }));

export const generateMetadata = async ({
	params,
}: Props): Promise<Metadata> => {
	const { slug } = await params;
	const guide = getGuide(slug);
	return { title: guide?.title ?? "문서" };
};

const Page = async ({ params }: Props) => {
	const { slug } = await params;
	const guide = getGuide(slug);
	if (!guide) notFound();
	return <DocsPage guide={guide} />;
};

export default Page;
