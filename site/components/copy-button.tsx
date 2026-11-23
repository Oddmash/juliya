"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@oddmash/ui/button";

export const copyText = async (value: string) => {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(value);
		return;
	}
	const input = document.createElement("textarea");
	const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	input.value = value;
	input.style.position = "fixed";
	input.style.opacity = "0";
	document.body.append(input);
	input.select();
	try {
		if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
	} finally {
		input.remove();
		previousFocus?.focus({ preventScroll: true });
	}
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
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const request = useRef(0);
	useEffect(() => () => { request.current++; clearTimeout(timer.current); }, []);
	const copy = async () => {
		const current = ++request.current;
		clearTimeout(timer.current);
		let result = "복사 완료";
		try {
			await copyText(value);
		} catch {
			result = "복사 실패";
		}
		if (current !== request.current) return;
		setState(result);
		timer.current = setTimeout(() => setState("복사"), 2000);
	};
	return (
		<Button variant="ghost" size="sm"
			type="button"
			className={`${className ?? ""} copy-feedback`}
			onClick={copy}
			aria-label={state}
			title={state}
		>
			{icon && (
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					aria-hidden="true"
				>
					{state === "복사 완료" ? <path d="m5 12 4 4 10-10" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>}
				</svg>
			)}
			<span role="status" aria-live="polite">{state}</span>
		</Button>
	);
};
