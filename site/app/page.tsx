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
				<WrapText as="h1" id="hero-title">한국어를 읽는 흐름에 맞춰.</WrapText>
				<p className="hero-description">한국어 문장의 의미 단위를 지켜 더 자연스럽게 줄을 바꿉니다. React, Vue, Svelte와 일반 HTML에서 사용할 수 있습니다.</p>
				<div className="hero-actions">
					<a className="button button-primary" href="#editor">내 문장으로 체험하기 <span aria-hidden="true">↘</span></a>
					<Link className="hero-docs" href="/docs/">문서 보기 <span aria-hidden="true">↗</span></Link>
				</div>
			</div>
			<LandingSpecimen />
		</header>
		<section id="install" className="landing-install" aria-labelledby="install-title">
			<div>
				<h2 id="install-title">바로 시작하기</h2>
				<p>패키지를 설치하고 사용하는 환경에 맞는 코드를 복사하세요.</p>
				<div className="install-command">
					<span className="command-prefix" aria-hidden="true">$</span>
					<code>{installCommand}</code>
					<CopyButton value={installCommand} className="icon-button" icon />
				</div>
			</div>
			<FrameworkExamples />
		</section>
		<div id="editor" className="landing-editor" tabIndex={-1}>
			<div className="landing-section-heading">
				<h2 id="playground-title">내 문장으로 비교하기</h2>
			</div>
			<Playground />
			<Link className="text-link inline-guide-link" href="/docs/inline/">강조, 링크가 포함된 문장에 적용하는 방법 →</Link>
		</div>
		<section className="landing-use-cases" aria-labelledby="use-cases-title">
			<div className="landing-section-heading">
				<h2 id="use-cases-title">문장의 의미를 끊지 않습니다.</h2>
				<p>화면의 크기는 달라져도 읽는 흐름은 그대로 유지하세요.</p>
			</div>
			<div className="landing-reading-grid">
				<article className="reading-sample">
					<div className="reading-meta"><span>읽기 좋은 콘텐츠</span><span>01 / Editorial</span></div>
					<WrapText as="h3">오늘의 작은 발견이 내일의 새로운 시선이 됩니다.</WrapText>
					<WrapText as="p">문장의 어절과 의미 단위를 고려해 제목뿐 아니라 강조와 <strong>링크가 포함된 문장</strong>도 자연스럽게 배치합니다.</WrapText>
					<Link className="text-link" href="/docs/inline/">인라인 마크업 사용법 →</Link>
				</article>
				<div className="reading-principles">
					<article><span className="reading-index">01</span><div><h3>의미 단위로 분리</h3><p>이어지는 표현을 함께 읽을 수 있는 줄바꿈 후보를 찾습니다.</p></div></article>
					<article><span className="reading-index">02</span><div><h3>실제 화면 폭에 맞춤</h3><p>글꼴과 컨테이너 너비를 바탕으로 줄을 배치합니다.</p></div></article>
					<article><span className="reading-index">03</span><div><h3>기존 마크업 그대로</h3><p>강조, 링크와 중첩 요소를 유지하며 화면 크기 변화에도 대응합니다.</p></div></article>
					<Link className="text-link" href="/comparison/">실제 비교 결과와 성능 살펴보기 →</Link>
				</div>
			</div>
		</section>
	</main>
);

export default Page;
