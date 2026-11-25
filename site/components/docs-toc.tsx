"use client";

import { useEffect, useState } from "react";
import { TableOfContents } from "@oddmash/ui/docs-navigation";
import type { Guide } from "../lib/guides";

export const DocsToc = ({ headings }: { headings: Guide["headings"] }) => {
	const [activeId, setActiveId] = useState<string>();

	useEffect(() => {
		const content = document.getElementById("doc-content");
		if (!content) return;
		const sections = Array.from(content.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]"));
		let frame = 0;
		const update = () => {
			const atBottom = scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
			const section = sections.findLast((heading) => {
				const margin = parseFloat(getComputedStyle(heading).scrollMarginTop);
				// Near the end, a heading can stay below its scroll margin because the page cannot scroll further.
				const readingLine = atBottom ? Math.max(margin + 24, innerHeight / 4) : margin + 24;
				return heading.getBoundingClientRect().top <= readingLine;
			});
			setActiveId(section?.id);
		};
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(update);
		};
		const syncHash = () => {
			const heading = sections.find(({ id }) => `#${encodeURIComponent(id)}` === location.hash || `#${id}` === location.hash);
			if (heading) setActiveId(heading.id);
			else schedule();
		};
		const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
		resize?.observe(content);
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		window.addEventListener("hashchange", syncHash);
		syncHash();
		return () => {
			cancelAnimationFrame(frame);
			resize?.disconnect();
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
			window.removeEventListener("hashchange", syncHash);
		};
	}, [headings]);

	const current = headings.find(({ id }) => id === activeId);
	const label = "이 문서의 내용";
	return <TableOfContents className="toc" label={label} contentId="doc-content"
		activeId={activeId ?? null} mobileLabel={current ? `${label} ${current.text}` : label}
		headings={headings.map(({ id, text, level }) => ({ id, label: text, level }))}
		onNavigate={heading => setActiveId(heading.id)} />;
};
