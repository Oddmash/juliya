"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface Item {
	slug: string;
	href: string;
	title: string;
	group: string;
	body: string;
}

export const DocsNavigation = ({
	items,
	current,
}: {
	items: Item[];
	current: string;
}) => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const groups = useMemo(
		() => [...new Set(items.map((item) => item.group))],
		[items],
	);
	const search = query.trim().toLowerCase();
	const matches = search
		? items
				.filter((item) =>
					`${item.title} ${item.body}`.toLowerCase().includes(search),
				)
				.slice(0, 8)
		: [];
	return (
		<>
			<button
				type="button"
				className="mobile-docs-toggle"
				aria-expanded={open}
				aria-controls="docs-sidebar"
				onClick={() => setOpen(!open)}
			>
				문서 목록 {open ? "닫기" : "열기"}
			</button>
			<aside
				className={`docs-sidebar ${open ? "is-open" : ""}`}
				id="docs-sidebar"
			>
				<label className="search-label" htmlFor="docs-search">
					문서 검색
				</label>
				<input
					className="docs-search"
					type="search"
					id="docs-search"
					placeholder="API, SSR, React"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					autoComplete="off"
				/>
				{search ? (
					<div className="search-results" aria-live="polite">
						{matches.length ? (
							matches.map((item) => (
								<Link href={item.href} key={item.slug}>
									{item.title}
								</Link>
							))
						) : (
							<p className="empty-search">검색 결과가 없습니다.</p>
						)}
					</div>
				) : (
					groups.map((group) => (
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
					))
				)}
			</aside>
		</>
	);
};
