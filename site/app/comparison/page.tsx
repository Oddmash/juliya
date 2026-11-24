import Link from "next/link";
import { JuliyaText } from "@oddmash/kowrap/react";

export const metadata = { title: "활용 예시" };

const Page = () => (
	<main id="main" className="container examples-page">
		<p className="docs-breadcrumb"><Link href="/docs/">문서</Link><span aria-hidden="true">/</span><span>활용 예시</span></p>
		<div className="examples-intro">
			<JuliyaText as="h1" locale="ko">읽는 흐름이 중요한 순간.</JuliyaText>
			<JuliyaText as="p" locale="ko" className="example-description">서로 다른 화면과 언어에서 줄이야가 어떻게 동작하는지 실제 UI로 확인하세요. 아래 문장은 모두 화면 폭에 맞춰 계산됩니다.</JuliyaText>
		</div>
		<div className="examples-grid">
			<section className="example-case" aria-labelledby="editorial-example">
				<h2 id="editorial-example">콘텐츠 제목</h2>
				<div className="example-surface example-editorial">
					<span className="example-meta">오늘의 이야기 · 3분 읽기</span>
					<JuliyaText as="h3" className="example-headline">오늘의 발견을 함께 나누는 작은 이야기</JuliyaText>
					<JuliyaText as="p">의미가 연결된 표현을 함께 읽을 수 있도록 제목과 본문을 자연스럽게 배치합니다.</JuliyaText>
				</div>
				<JuliyaText as="p" locale="ko" className="example-description">기사, 블로그, 콘텐츠 카드처럼 제목의 의미와 인상이 중요한 화면.</JuliyaText>
			</section>
			<section className="example-case" aria-labelledby="notification-example">
				<h2 id="notification-example">모바일 알림</h2>
				<div className="example-surface example-notification" lang="ja">
					<div className="example-notification-header"><span className="example-notification-icon" aria-hidden="true">✓</span><span className="example-meta">お知らせ</span></div>
					<JuliyaText as="h3" locale="ja">新しい機能を、今すぐチェック。</JuliyaText>
					<JuliyaText as="p" locale="ja">画面の幅に合わせて読みやすく。</JuliyaText>
				</div>
				<JuliyaText as="p" locale="ko" className="example-description">좁은 화면에서도 각 언어에 맞는 어절과 문장부호 경계를 고려합니다.</JuliyaText>
			</section>
			<section className="example-case" aria-labelledby="developer-example">
				<h2 id="developer-example">개발 문서</h2>
				<div className="example-surface example-developer" lang="en">
					<span className="example-meta">GUIDE / REACT</span>
					<JuliyaText as="h3" locale="en">Build a better experience with React and TypeScript.</JuliyaText>
					<code>import &#123; JuliyaText &#125; from &apos;@oddmash/kowrap/react&apos;;</code>
				</div>
				<JuliyaText as="p" locale="ko" className="example-description">긴 영문 설명과 기술 용어가 포함된 가이드에서도 읽기 흐름을 유지합니다.</JuliyaText>
			</section>
		</div>
		<div className="examples-actions"><Link className="button button-primary" href="/#editor">내 문장으로 체험하기</Link><Link className="button hero-secondary" href="/docs/react/">적용 방법 보기</Link></div>
	</main>
);
export default Page;
