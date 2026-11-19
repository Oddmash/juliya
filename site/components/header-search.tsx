"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@oddmash/ui/button";
import { Input } from "@oddmash/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@oddmash/ui/dialog";

interface SearchItem {
	slug: string;
	title: string;
	group: string;
	body: string;
	href: string;
}

export const HeaderSearch = ({ items }: { items: SearchItem[] }) => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const input = useRef<HTMLInputElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const results = useRef<HTMLDivElement>(null);
	const search = query.trim().toLowerCase();
	const matches = (search ? items.filter(({ title, body }) => `${title} ${body}`.toLowerCase().includes(search)) : items).slice(0, 8);
	useEffect(() => {
		const handle = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen(true);
			}
		};
		window.addEventListener("keydown", handle);
		return () => window.removeEventListener("keydown", handle);
	}, []);
	return <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setQuery(""); }}>
		<DialogTrigger asChild>
			<Button ref={trigger} variant="secondary" size="sm" className="header-search-trigger" aria-label="문서 검색" aria-keyshortcuts="Meta+K Control+K">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
				<span>문서 검색</span><kbd>⌘ K</kbd>
			</Button>
		</DialogTrigger>
		<DialogContent className="search-dialog" theme="dark" onOpenAutoFocus={(event) => { event.preventDefault(); input.current?.focus(); }} onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus(); }}>
			<div className="search-dialog-heading"><DialogTitle>문서 검색</DialogTitle><DialogClose asChild><Button variant="ghost" size="sm" aria-label="검색 닫기">닫기</Button></DialogClose></div>
			<DialogDescription className="sr-only">제목이나 문서 내용을 검색합니다.</DialogDescription>
			<Input ref={input} id="docs-search" type="search" placeholder="API, SSR, React" aria-label="문서 검색어" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); results.current?.querySelector("a")?.focus(); } else if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); results.current?.querySelector("a")?.click(); } }} />
			<div className="search-dialog-results" ref={results} aria-live="polite" onKeyDown={(event) => {
				if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
				const links = Array.from(results.current?.querySelectorAll("a") ?? []);
				const index = links.indexOf(document.activeElement as HTMLAnchorElement);
				if (index < 0) return;
				event.preventDefault();
				if (event.key === "ArrowUp" && index === 0) input.current?.focus();
				else links[index + (event.key === "ArrowDown" ? 1 : -1)]?.focus();
			}}>
				{matches.length ? matches.map((item) => <Link key={item.slug} href={item.href} onClick={() => { setOpen(false); setQuery(""); }}><span>{item.title}</span><small>{item.group}</small></Link>) : <p className="empty-search">검색 결과가 없습니다.</p>}
			</div>
		</DialogContent>
	</Dialog>;
};
