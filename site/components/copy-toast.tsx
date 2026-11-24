"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Toast } from "@oddmash/ui/toast";

type CopyResult = "복사 완료" | "복사 실패";
type CopyNotice = { id: number; result: CopyResult; source: HTMLElement | null };
const MAX_COPY_NOTICES = 4;
const CopyToastContext = createContext<(result: CopyResult) => void>(() => {});

export const useCopyToast = () => useContext(CopyToastContext);

const CopyToastItem = ({ notice, onDismiss }: { notice: CopyNotice; onDismiss: (id: number) => void }) => {
	const region = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		const frame = requestAnimationFrame(() => setOpen(true));
		return () => cancelAnimationFrame(frame);
	}, []);
	useEffect(() => {
		if (!open || hovered || focused) return;
		const timer = setTimeout(() => onDismiss(notice.id), notice.result === "복사 실패" ? 5500 : 2800);
		return () => clearTimeout(timer);
	}, [open, hovered, focused, notice.id, notice.result, onDismiss]);

	const dismiss = () => {
		const restore = region.current?.contains(document.activeElement) && notice.source?.isConnected;
		onDismiss(notice.id);
		if (restore) notice.source?.focus({ preventScroll: true });
	};

	return (
		<Toast ref={region} className="copy-toast-item" data-copy-notice={notice.id} open={open} title={notice.result} tone={notice.result === "복사 실패" ? "danger" : "neutral"} onDismiss={dismiss} dismissLabel="알림 닫기"
			onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
			onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
			{notice.result === "복사 실패" ? "텍스트를 직접 선택해 복사해 주세요." : null}
		</Toast>
	);
};

export const CopyToastProvider = ({ children }: { children: ReactNode }) => {
	const [notices, setNotices] = useState<CopyNotice[]>([]);
	const nextId = useRef(0);
	const dismiss = useCallback((id: number) => setNotices(items => items.filter(item => item.id !== id)), []);
	const notify = useCallback((result: CopyResult) => {
		const source = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const notice = { id: ++nextId.current, result, source };
		const focusedId = source?.closest<HTMLElement>("[data-copy-notice]")?.dataset.copyNotice;
		setNotices(items => {
			const next = [...items, notice];
			if (next.length <= MAX_COPY_NOTICES) return next;
			const evicted = next.find(item => String(item.id) !== focusedId);
			return next.filter(item => item.id !== evicted?.id);
		});
	}, []);
	return (
		<CopyToastContext.Provider value={notify}>
			{children}
			<div className="copy-toast-region">
				{notices.map(notice => <CopyToastItem key={notice.id} notice={notice} onDismiss={dismiss} />)}
			</div>
		</CopyToastContext.Provider>
	);
};
