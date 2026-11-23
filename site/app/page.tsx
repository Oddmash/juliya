import Link from "next/link";
import localFont from "next/font/local";
import { WrapText } from "@oddmash/kowrap/react";
import { CopyButton } from "../components/copy-button";
import { FrameworkExamples } from "../components/framework-examples";
import { LandingSpecimen } from "../components/landing-specimen";
import { Playground } from "../components/playground";
import "./landing.css";

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

const installCommand = "npm install @oddmash/kowrap";

const Page = () => (
	<main id="main" className={`container landing ${display.variable} ${mono.variable}`}>
		<header className="landing-intro">
			<div className="hero-copy">
				<p className="landing-kicker"><span aria-hidden="true" /> 한국어 줄바꿈 라이브러리</p>
				<h1 id="hero-title"><span>한국어를 읽는</span>{" "}<span>흐름에 맞춰.</span></h1>
				<p className="hero-description">화면 폭에 맞게 문장을 자연스럽게 나누세요. 어절과 의미를 고려하는 오픈소스 줄바꿈 엔진입니다.</p>
				<div className="hero-actions">
					<a className="button button-primary" href="#editor">내 문장으로 체험하기 <span aria-hidden="true">↘</span></a>
					<Link className="hero-docs" href="/docs/">문서 보기 <span aria-hidden="true">↗</span></Link>
				</div>
			</div>
			<LandingSpecimen />
		</header>
		<div className="landing-proof-note">같은 문장, 글꼴, 화면 폭으로 비교합니다.</div>
		<div id="editor" className="landing-editor" tabIndex={-1}>
			<div className="landing-section-heading">
				<h2>직접 써 보세요.</h2>
				<p>문장과 너비를 바꾸며 차이를 확인하세요.</p>
			</div>
			<Playground />
			<details className="inline-details">
				<summary>인라인 마크업 예제</summary>
				<div className="inline-example">
					<div className="inline-result">
						<WrapText as="p" id="inline-preview" style={{ maxWidth: 320, fontSize: 24 }}>
							읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과 <a href="#playground">실제 예제</a>를 만나보세요.
						</WrapText>
					</div>
					<pre><code>{`<WrapText as="p">\n  읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과\n  <a href="#playground">실제 예제</a>를 만나보세요.\n</WrapText>`}</code></pre>
				</div>
				<Link className="text-link" href="/docs/inline/">인라인 마크업 사용법</Link>
			</details>
		</div>
		<section className="landing-use-cases" aria-labelledby="use-cases-title">
			<div className="landing-section-heading">
				<h2 id="use-cases-title">문장이 놓이는 자리.</h2>
				<Link className="text-link" href="/comparison/">활용 사례와 성능 비교</Link>
			</div>
			<div className="use-case-grid">
				<article className="use-case"><span className="case-index">01 · 제목</span><div className="case-sample"><WrapText as="h3">좋은 글은 보기 편한 화면에서 시작됩니다.</WrapText></div><p>랜딩 페이지와 콘텐츠 제목의 어색한 줄바꿈을 다듬습니다.</p></article>
				<article className="use-case"><span className="case-index">02 · 모바일 카드</span><div className="case-sample case-sample-card"><span className="case-label">서비스 소식</span><WrapText as="h3">새로운 기능을 지금 만나보세요.</WrapText></div><p>좁은 카드에서도 텍스트를 자연스럽게 배치합니다.</p></article>
				<article className="use-case"><span className="case-index">03 · 혼합 문장</span><div className="case-sample case-sample-mixed"><WrapText as="h3">React와 TypeScript로 더 나은 UI를 만드세요.</WrapText></div><p>한글과 영문이 섞인 인터페이스에도 적용할 수 있습니다.</p></article>
			</div>
		</section>
		<section id="install" className="landing-install" aria-labelledby="install-title">
			<div>
				<h2 id="install-title">몇 줄이면 충분합니다.</h2>
				<p>React, Next.js, Vue, Svelte 또는 일반 HTML에서 사용할 수 있습니다.</p>
				<div className="install-command">
					<span className="command-prefix" aria-hidden="true">$</span>
					<code>{installCommand}</code>
					<CopyButton value={installCommand} className="icon-button" icon />
				</div>
			</div>
			<FrameworkExamples />
		</section>
	</main>
);

export default Page;
