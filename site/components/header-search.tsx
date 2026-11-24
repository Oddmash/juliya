"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@oddmash/ui/button";
import { Input } from "@oddmash/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@oddmash/ui/dialog";
import { landingCopy } from "../lib/locales";
import type { SiteLocale } from "../lib/locales";

interface SearchItem {
	slug: string;
	title: string;
	group: string;
	body: string;
	href: string;
}

export const HeaderSearch = ({ items, locale = "ko" }: { items: SearchItem[]; locale?: SiteLocale }) => {
	const copy = landingCopy[locale];
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
			<Button ref={trigger} variant="secondary" size="sm" className="header-search-trigger" aria-label={copy.search} aria-keyshortcuts="Meta+K Control+K">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
				<span>{copy.search}</span><kbd>⌘ K</kbd>
			</Button>
		</DialogTrigger>
		<DialogContent className="search-dialog" theme="dark" onOpenAutoFocus={(event) => { event.preventDefault(); input.current?.focus(); }} onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus(); }}>
			<div className="search-dialog-heading"><DialogTitle>{copy.search}</DialogTitle><DialogClose asChild><Button variant="ghost" size="sm" aria-label={locale === "ko" ? "검색 닫기" : copy.close}>{copy.close}</Button></DialogClose></div>
			<DialogDescription className="sr-only">{copy.search}</DialogDescription>
			<Input ref={input} id="docs-search" type="search" placeholder="API, SSR, React" aria-label={locale === "ko" ? "문서 검색어" : copy.search} autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
				if (event.nativeEvent.isComposing) return;
				if (event.key === "ArrowDown") {
					event.preventDefault();
					results.current?.querySelector("a")?.focus();
				} else if (event.key === "Enter") {
					event.preventDefault();
					results.current?.querySelector("a")?.click();
				}
			}} />
			<div className="search-dialog-results" ref={results} aria-live="polite" onKeyDown={(event) => {
				if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
				const links = Array.from(results.current?.querySelectorAll("a") ?? []);
				const index = links.indexOf(document.activeElement as HTMLAnchorElement);
				if (index < 0) return;
				event.preventDefault();
				if (event.key === "ArrowUp" && index === 0) input.current?.focus();
				else links[index + (event.key === "ArrowDown" ? 1 : -1)]?.focus();
			}}>
				{matches.length ? matches.map((item) => <Link key={item.slug} href={item.href} onClick={() => { setOpen(false); setQuery(""); }}><span>{item.title}</span><small>{item.group}</small></Link>) : <p className="empty-search">{copy.noResults}</p>}
			</div>
		</DialogContent>
	</Dialog>;
};
