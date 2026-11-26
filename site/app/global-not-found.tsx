import type { Metadata } from "next";
import Link from "next/link";
import { SiteDocument } from "../components/site-document";

export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다 | Juliya" };

export default function GlobalNotFound() {
	return <SiteDocument locale="ko">
		<main id="main" className="container">
			<h1>페이지를 찾을 수 없습니다</h1>
			<p>주소를 확인하거나 <Link href="/">홈으로 돌아가세요.</Link></p>
		</main>
	</SiteDocument>;
}
