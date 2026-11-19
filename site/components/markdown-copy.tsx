"use client";

import { useEffect } from "react";
import { copyText } from "./copy-button";

export const MarkdownCopy = () => {
	useEffect(() => {
		const container = document.getElementById("doc-content");
		if (!container) return;
		const handle = async (event: MouseEvent) => {
			if (!(event.target instanceof Element)) return;
			const button =
				event.target.closest<HTMLButtonElement>("[data-copy-target]");
			if (!button) return;
			const value = document.getElementById(
				button.dataset.copyTarget ?? "",
			)?.textContent;
			if (value === undefined || value === null) return;
			try {
				await copyText(value);
				button.textContent = "복사 완료";
			} catch {
				button.textContent = "복사 실패";
			}
			setTimeout(() => {
				button.textContent = "복사";
			}, 1400);
		};
		container.addEventListener("click", handle);
		return () => container.removeEventListener("click", handle);
	}, []);
	return null;
};
