"use client";

import { useEffect } from "react";
import { copyText } from "./copy-button";
import { useCopyToast } from "./copy-toast";
import { mountKowrap } from "@oddmash/kowrap/dom";

export const MarkdownCopy = () => {
	const notifyCopy = useCopyToast();
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
		const selectTab = (tab: HTMLButtonElement) => {
			const group = tab.closest<HTMLElement>("[data-package-tabs]");
			if (!group || tab.getAttribute("aria-selected") === "true" || !tab.dataset.packageCode) return;
			for (const item of group.querySelectorAll<HTMLButtonElement>("[data-package-tab]")) {
				const selected = item === tab;
				item.setAttribute("aria-selected", String(selected));
				item.tabIndex = selected ? 0 : -1;
				const panel = document.getElementById(item.getAttribute("aria-controls") ?? "");
				if (panel && group.contains(panel)) panel.hidden = !selected;
			}
			const button = group.querySelector<HTMLButtonElement>("[data-copy-target]");
			if (!button) return;
			clearTimeout(timers.get(button));
			requests.set(button, (requests.get(button) ?? 0) + 1);
			button.dataset.copyTarget = tab.dataset.packageCode;
			button.textContent = "복사";
		};
		const handleKey = (event: KeyboardEvent) => {
			if (!(event.target instanceof HTMLButtonElement) || !event.target.matches("[data-package-tab]")) return;
			const tabs = Array.from(event.target.closest("[role=tablist]")?.querySelectorAll<HTMLButtonElement>("[data-package-tab]") ?? []);
			const index = tabs.indexOf(event.target);
			const next = event.key === "ArrowRight" ? (index + 1) % tabs.length :
				event.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length :
				event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
			if (next < 0 || !tabs[next]) return;
			event.preventDefault();
			selectTab(tabs[next]);
			tabs[next].focus();
		};
		const handle = async (event: MouseEvent) => {
			if (!(event.target instanceof Element)) return;
			const tab = event.target.closest<HTMLButtonElement>("[data-package-tab]");
			if (tab) { selectTab(tab); return; }
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
			let status: "복사 완료" | "복사 실패" = "복사 완료";
			try {
				await copyText(value);
			} catch {
				status = "복사 실패";
			}
			if (disposed || requests.get(button) !== current) return;
			button.textContent = status;
			notifyCopy(status);
			timers.set(button, setTimeout(() => {
				button.textContent = "복사";
				timers.delete(button);
			}, 2000));
		};
		container.addEventListener("click", handle);
		container.addEventListener("keydown", handleKey);
		return () => { disposed = true; timers.forEach(clearTimeout); container.removeEventListener("click", handle); container.removeEventListener("keydown", handleKey); controllers.forEach((controller) => controller.destroy()); };
	}, [notifyCopy]);
	return null;
};
