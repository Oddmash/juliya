"use client";

import { ClipboardButton, copyText } from "@oddmash/ui/clipboard-button";
import { usePathname } from "next/navigation";
import { copyLabels, languageFromPath } from "../lib/locales";
import { useCopyToast } from "./copy-toast";

export { copyText };

export const CopyButton = ({
	value,
	className,
	icon = false,
}: {
	value: string;
	className?: string;
	icon?: boolean;
}) => {
	const labels = copyLabels[languageFromPath(usePathname() ?? "/")];
	const notifyCopy = useCopyToast();
	const copyStateLabels = { idle: labels.copy, pending: labels.pending, copied: labels.success, error: labels.failure };
	return (
		<ClipboardButton text={value} labels={copyStateLabels} resetDelay={2000} announce={false}
			variant="ghost" size="sm" className={`${className ?? ""} copy-feedback`}
			onCopied={() => notifyCopy("복사 완료")} onCopyError={() => notifyCopy("복사 실패")}>
			{state => <>
				{icon && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
					{state === "copied" ? <path d="m5 12 4 4 10-10" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>}
				</svg>}
				<span>{copyStateLabels[state]}</span>
			</>}
		</ClipboardButton>
	);
};
