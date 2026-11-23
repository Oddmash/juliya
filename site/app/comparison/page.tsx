import Link from "next/link";
import { BrowserComparison } from "../../components/browser-comparison";

export const metadata = { title: "줄바꿈 비교 및 활용 사례" };

const Page = () => (
  <main id="main" className="container docs-content" style={{ maxWidth: 800, paddingBlock: 40 }}>
    <h1>실제 사용 환경에서 비교하기</h1>
    <p>줄바꿈 결과와 측정 비용을 함께 살펴보세요. 아래 문장은 제품 UI를 가정한 예제이며 실제 고객 도입 사례를 의미하지 않습니다.</p>
    <BrowserComparison />
    <h2>적용 예시</h2>
    <ul>
      <li>랜딩 제목: <Link href="/docs/react/">React WrapText</Link>로 요소 폭에 맞춰 줄을 나눕니다.</li>
      <li>결제 안내: <Link href="/docs/dom/">DOM 어댑터</Link>를 사용해 기존 HTML을 유지합니다.</li>
      <li>혼합 언어 카드: <Link href="/docs/core/">코어 엔진</Link>에 글꼴과 픽셀 측정 함수를 전달합니다.</li>
    </ul>
    <p>실제 서비스에서는 글꼴, 너비, 문장, 브라우저에 따라 결과가 달라집니다. <Link href="/#editor">직접 문장 바꾸기</Link></p>
  </main>
);
export default Page;
