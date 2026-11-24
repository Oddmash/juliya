import Link from "next/link";
import { BrowserComparison } from "../../components/browser-comparison";

export const metadata = { title: "줄바꿈 비교 및 활용 사례" };

const Page = () => (
  <main id="main" className="container docs-content" style={{ maxWidth: 800, paddingBlock: 56 }}>
    <p className="docs-breadcrumb"><Link href="/docs/">문서</Link><span aria-hidden="true">/</span><span>성능 측정</span></p>
    <h1>성능 측정</h1>
    <p>줄이야의 줄바꿈 계산 비용을 개발 환경에서 확인하는 기술 참고 자료입니다. 줄 수와 처리 시간은 문장의 의미 단위를 얼마나 잘 유지하는지 평가하지 않습니다.</p>
    <details className="benchmark-details">
      <summary>브라우저 벤치마크 열기</summary>
      <BrowserComparison />
    </details>
    <p>실제 줄바꿈 품질은 <Link href="/#editor">Playground</Link>에서 확인할 수 있습니다.</p>
  </main>
);
export default Page;
