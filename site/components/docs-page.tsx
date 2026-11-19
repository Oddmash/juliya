import Link from "next/link";
import { guideHref, getGuides } from "../lib/guides";
import type { Guide } from "../lib/guides";
import { DocsNavigation } from "./docs-navigation";
import { MarkdownCopy } from "./markdown-copy";

export const DocsPage = ({ guide }: { guide: Guide }) => {
	const guides = getGuides();
	const index = guides.findIndex((item) => item.slug === guide.slug);
	const previous = guides[index - 1];
	const next = guides[index + 1];
	const items = guides.map(({ slug, group, title }) => ({
		slug,
		group,
		title,
		href: guideHref(slug),
	}));
	return (
		<main id="main" className="container docs-shell">
			<DocsNavigation items={items} current={guide.slug} />
			<article className="docs-content">
				<div
					id="doc-content"
					dangerouslySetInnerHTML={{ __html: guide.html }}
				/>
				<MarkdownCopy key={guide.slug} />
				<div className="docs-bottom">
					{previous ? (
						<Link href={guideHref(previous.slug)}>이전: {previous.title}</Link>
					) : (
						<span />
					)}
					{next ? (
						<Link href={guideHref(next.slug)}>다음: {next.title}</Link>
					) : (
						<Link href="/#playground">체험하기</Link>
					)}
				</div>
			</article>
			<aside className="toc" aria-label="이 문서의 내용">
				<strong>이 문서의 내용</strong>
				{guide.headings.map(({ id, text, level }) => (
					<a key={id} data-level={level} href={`#${id}`}>
						{text}
					</a>
				))}
			</aside>
		</main>
	);
};
