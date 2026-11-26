import type { ReactNode } from "react";
import { SiteDocument } from "../../components/site-document";

export { metadata } from "../../components/site-document";

export default function KoreanLayout({ children }: { children: ReactNode }) {
	return <SiteDocument locale="ko">{children}</SiteDocument>;
}
