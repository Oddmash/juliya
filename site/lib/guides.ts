import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderMarkdown } from "./markdown.mjs";

const guideOrder = [
	{ slug: "start", group: "시작하기" },
	{ slug: "core", group: "핵심 기능" },
	{ slug: "forced-breaks", group: "핵심 기능" },
	{ slug: "inline", group: "핵심 기능" },
	{ slug: "dom", group: "프레임워크" },
	{ slug: "react", group: "프레임워크" },
	{ slug: "vue", group: "프레임워크" },
	{ slug: "svelte", group: "프레임워크" },
	{ slug: "ssr", group: "심화" },
	{ slug: "api", group: "심화" },
	{ slug: "troubleshooting", group: "심화" },
];

export interface GuideSummary {
	slug: string;
	group: string;
	title: string;
	body: string;
}

export interface Guide extends GuideSummary {
	html: string;
	headings: { level: number; text: string; id: string }[];
}

export const guideHref = (slug: string) =>
	slug === "start" ? "/docs/" : `/docs/${slug}/`;

export const getGuides = (): Guide[] =>
	guideOrder.map(({ slug, group }) => {
		const body = readFileSync(
			join(process.cwd(), "../docs/guide", `${slug}.md`),
			"utf8",
		);
		const rendered = renderMarkdown(
			body,
			process.env.NEXT_PUBLIC_BASE_PATH ?? "",
		) as Pick<Guide, "title" | "headings" | "html">;
		return { slug, group, body, ...rendered };
	});

export const getGuide = (slug: string) =>
	getGuides().find((guide) => guide.slug === slug);
