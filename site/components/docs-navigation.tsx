"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@oddmash/ui/button";

interface Item {
	slug: string;
	href: string;
	title: string;
	group: string;
}

export const DocsNavigation = ({
	items,
	current,
}: {
	items: Item[];
	current: string;
}) => {
	const [open, setOpen] = useState(false);
	const groups = useMemo(
		() => [...new Set(items.map((item) => item.group))],
		[items],
	);
	return (
		<>
			<Button variant="secondary"
				type="button"
				className="mobile-docs-toggle"
				aria-expanded={open}
				aria-controls="docs-sidebar"
				onClick={() => setOpen(!open)}
			>
				문서 목록 {open ? "닫기" : "열기"}
			</Button>
			<aside
				className={`docs-sidebar ${open ? "is-open" : ""}`}
				id="docs-sidebar"
			>
				{groups.map((group) => (
						<div key={group}>
							<p className="sidebar-label">{group}</p>
							<nav className="docs-nav" aria-label={group}>
								{items
									.filter((item) => item.group === group)
									.map((item) => (
										<Link
											key={item.slug}
											href={item.href}
											aria-current={item.slug === current ? "page" : undefined}
										>
											{item.title}
										</Link>
									))}
							</nav>
						</div>
					))}
			</aside>
		</>
	);
};
