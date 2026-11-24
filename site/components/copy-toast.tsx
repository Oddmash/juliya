"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Toast } from "@oddmash/ui/toast";

type CopyResult = "복사 완료" | "복사 실패";
const CopyToastContext = createContext<(result: CopyResult) => void>(() => {});

export const useCopyToast = () => useContext(CopyToastContext);

export const CopyToastProvider = ({ children }: { children: ReactNode }) => {
	const [result, setResult] = useState<CopyResult | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const dismiss = useCallback(() => {
		clearTimeout(timer.current);
		setResult(null);
	}, []);
	const notify = useCallback((next: CopyResult) => {
		clearTimeout(timer.current);
		setResult(next);
		timer.current = setTimeout(() => setResult(null), next === "복사 실패" ? 5500 : 2800);
	}, []);
	useEffect(() => () => clearTimeout(timer.current), []);
	return (
		<CopyToastContext.Provider value={notify}>
			{children}
			<Toast className="copy-toast-region" open={result !== null} title={result ?? ""} tone={result === "복사 실패" ? "danger" : "neutral"} onDismiss={dismiss} dismissLabel="알림 닫기">
				{result === "복사 실패" ? "텍스트를 직접 선택해 복사해 주세요." : "클립보드에 복사했어요."}
			</Toast>
		</CopyToastContext.Provider>
	);
};
