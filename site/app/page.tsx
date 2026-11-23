import Link from "next/link";
import localFont from "next/font/local";
import { CopyButton } from "../components/copy-button";
import { FrameworkExamples } from "../components/framework-examples";
import { Playground } from "../components/playground";
import { WrapText } from "@oddmash/kowrap/react";

const display = localFont({
	src: "./fonts/kowrap-display.woff2",
	variable: "--landing-display",
	weight: "100 900",
	display: "swap",
	adjustFontFallback: false,
});

const mono = localFont({
	src: "./fonts/geist-mono-ascii.woff2",
	variable: "--landing-mono",
	weight: "100 900",
	display: "swap",
	preload: false,
	adjustFontFallback: false,
});

const Page = () => (
	<main id="main" className={`container landing ${display.variable} ${mono.variable}`}>
		<section className="hero" aria-labelledby="hero-title">
			<h1 id="hero-title"><span>한국어를 읽는</span>{" "}<span>흐름대로</span></h1>
			<span className="hero-fold" aria-hidden="true" />
			<div className="hero-content">
				<p className="hero-description">같은 문장도 어디서 줄을 바꾸느냐에 따라 다르게 읽힙니다.</p>
				<div className="hero-actions">
					<a className="button button-primary hero-try" href="#playground">
						줄바꿈 체험하기 <span aria-hidden="true">↓</span>
					</a>
					<Link className="button hero-docs" href="/docs/">
						문서 보기
					</Link>
				</div>
			</div>
		</section>
		<Playground />
		<section className="integration" aria-labelledby="inline-title">
			<div className="integration-description">
				<p className="eyebrow">인라인 마크업</p>
				<WrapText as="h2" id="inline-title">인라인 마크업을 유지하는 줄바꿈</WrapText>
				<WrapText as="p">링크와 강조, 중첩된 태그가 포함된 문장도 각 요소의 계산된 글꼴로 폭을 측정합니다. 기존 속성과 이벤트는 유지합니다.</WrapText>
				<Link className="text-link" href="/docs/inline/">인라인 마크업 사용법</Link>
			</div>
			<div className="inline-example">
				<div className="inline-result">
					<span className="eyebrow">렌더링 결과</span>
					<WrapText as="p" id="inline-preview" style={{ maxWidth: 320, fontSize: 24 }}>
						읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과 <a href="#playground">실제 예제</a>를 만나보세요.
					</WrapText>
				</div>
				<pre><code>{`<WrapText as="p">\n  읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과\n  <a href="#playground">실제 예제</a>를 만나보세요.\n</WrapText>`}</code></pre>
			</div>
		</section>
		<section className="principles" aria-labelledby="principles-title">
			<div>
				<p className="eyebrow">작동 방식</p>
				<WrapText as="h2" id="principles-title">줄바꿈을 계산하는 원칙</WrapText>
			</div>
			<div className="principles-list">
				<div className="principle">
					<span className="principle-symbol" aria-hidden="true">
						가나
					</span>
					<div>
						<h3>어절을 보존합니다.</h3>
						<WrapText as="p" strategy="greedy">한글 어절과 유니코드 문자 경계를 기준으로 줄바꿈 후보를 만들고, 너무 긴 어절만 필요한 만큼 나눕니다.</WrapText>
					</div>
				</div>
				<div className="principle">
					<span className="principle-symbol" aria-hidden="true">
						≋
					</span>
					<div>
						<h3>줄의 균형을 고릅니다.</h3>
						<WrapText as="p" strategy="greedy">같은 줄 수 안에서 남는 폭과 문장 경계를 비교해 짧은 마지막 줄을 줄입니다.</WrapText>
					</div>
				</div>
				<div className="principle">
					<span className="principle-symbol" aria-hidden="true">
						↵
					</span>
					<div>
						<h3>의도한 개행은 유지합니다.</h3>
						<WrapText as="p" strategy="greedy">명시적 개행과 강제 위치는 화면이 넓어지거나 좁아져도 그대로 유지됩니다.</WrapText>
					</div>
				</div>
			</div>
		</section>
		<section className="integration" aria-labelledby="integration-title">
			<div className="integration-description">
				<p className="eyebrow">프레임워크 독립</p>
				<WrapText as="h2" id="integration-title">다양한 프레임워크 지원</WrapText>
				<WrapText as="p">프레임워크에 종속되지 않는 TypeScript 코어를 기반으로 React, Next.js, Vue, Svelte 및 일반 HTML을 지원합니다.</WrapText>
				<div className="install-command">
					<span className="command-prefix" aria-hidden="true">$</span>
					<code>npm install @oddmash/kowrap</code>
					<CopyButton value="npm install @oddmash/kowrap" className="icon-button" icon />
				</div>
				<Link className="text-link" href="/docs/">
					설치 및 프레임워크별 사용법
				</Link>
			</div>
			<FrameworkExamples />
		</section>
		<section className="docs-section" aria-labelledby="docs-title">
			<div>
				<p className="eyebrow">개발자 문서</p>
				<WrapText as="h2" id="docs-title">설치 및 사용 가이드</WrapText>
				<WrapText as="p">프레임워크별 예제, API 사용법, 서버 렌더링 및 강제 개행을 확인할 수 있습니다.</WrapText>
			</div>
			<div className="docs-links">
				<Link href="/docs/">
					<strong>빠르게 시작하기</strong>
					<span>설치와 첫 예제</span>
				</Link>
				<Link href="/docs/core/">
					<strong>코어 API</strong>
					<span>줄바꿈 결과 및 옵션</span>
				</Link>
				<Link href="/docs/forced-breaks/">
					<strong>의도적인 개행</strong>
					<span>UTF-16 위치와 React 훅</span>
				</Link>
				<Link href="/docs/ssr/">
					<strong>SSR과 하이드레이션</strong>
					<span>Next.js 및 서버 초기 화면</span>
				</Link>
			</div>
		</section>
	</main>
);

export default Page;
