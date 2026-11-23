"use client";

import { useEffect } from "react";
import { copyText } from "./copy-button";
import { mountKowrap } from "@oddmash/kowrap/dom";

export const MarkdownCopy = () => {
	useEffect(() => {
		const container = document.getElementById("doc-content");
		if (!container) return;
		const timers = new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>();
		const requests = new Map<HTMLButtonElement, number>();
		let disposed = false;
		const controllers = Array.from(container.querySelectorAll<HTMLElement>("h1, h2, h3, p, li"))
			.filter((element) => !element.closest("pre, .doc-code, .doc-table") && !element.querySelector("p, ul, ol"))
			.map((element) => {
				const strategy = /^H[1-3]$/.test(element.tagName) || (element.textContent?.length ?? 0) <= 140 ? "balanced" : "greedy";
				const controller = mountKowrap(element, { inline: true, strategy });
				element.dataset.kowrapProse = "";
				return controller;
			});
		const handle = async (event: MouseEvent) => {
			if (!(event.target instanceof Element)) return;
			const button =
				event.target.closest<HTMLButtonElement>("[data-copy-target]");
			if (!button) return;
			const value = document.getElementById(
				button.dataset.copyTarget ?? "",
			)?.textContent;
			if (value === undefined || value === null) return;
			const current = (requests.get(button) ?? 0) + 1;
			requests.set(button, current);
			clearTimeout(timers.get(button));
			let status = "복사 완료";
			try {
				await copyText(value);
			} catch {
				status = "복사 실패";
			}
			if (disposed || requests.get(button) !== current) return;
			button.textContent = status;
			timers.set(button, setTimeout(() => {
				button.textContent = "복사";
				timers.delete(button);
			}, 2000));
		};
		container.addEventListener("click", handle);
		return () => { disposed = true; timers.forEach(clearTimeout); container.removeEventListener("click", handle); controllers.forEach((controller) => controller.destroy()); };
	}, []);
	return null;
};
