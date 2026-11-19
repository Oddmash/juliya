"use client";

import { useState } from "react";

export const copyText = async (value: string) => {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(value);
		return;
	}
	const input = document.createElement("textarea");
	input.value = value;
	input.style.position = "fixed";
	input.style.opacity = "0";
	document.body.append(input);
	input.select();
	const copied = document.execCommand("copy");
	input.remove();
	if (!copied) throw new Error("Clipboard unavailable");
};

export const CopyButton = ({
	value,
	className,
	icon = false,
}: {
	value: string;
	className?: string;
	icon?: boolean;
}) => {
	const [state, setState] = useState("복사");
	const copy = async () => {
		try {
			await copyText(value);
			setState("복사 완료");
		} catch {
			setState("복사 실패");
		}
		setTimeout(() => setState("복사"), 1500);
	};
	return (
		<button
			type="button"
			className={className}
			onClick={copy}
			aria-label={state}
			title={state}
		>
			{icon ? (
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					aria-hidden="true"
				>
					<rect x="8" y="8" width="12" height="12" rx="2" />
					<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
				</svg>
			) : (
				state
			)}
		</button>
	);
};
