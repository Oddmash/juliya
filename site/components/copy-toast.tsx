"use client";

import { useCallback } from "react";
import type { ReactNode } from "react";
import { ToastProvider, useToast } from "@oddmash/ui/toast-provider";
import { usePathname } from "next/navigation";
import { copyLabels, languageFromPath } from "../lib/locales";

type CopyResult = "복사 완료" | "복사 실패";

export const useCopyToast = () => {
	const { showToast } = useToast();
	const labels = copyLabels[languageFromPath(usePathname() ?? "/")];
	return useCallback((result: CopyResult) => {
		const failed = result === "복사 실패";
		showToast({
			title: failed ? labels.failure : labels.success,
			description: failed ? labels.hint : undefined,
			tone: failed ? "danger" : "neutral",
			duration: failed ? null : 2800,
		});
	}, [showToast, labels]);
};

export const CopyToastProvider = ({ children }: { children: ReactNode }) => {
	const labels = copyLabels[languageFromPath(usePathname() ?? "/")];
	return <ToastProvider maxVisible={4} dismissLabel={labels.dismiss} className="copy-toast-region">{children}</ToastProvider>;
};
