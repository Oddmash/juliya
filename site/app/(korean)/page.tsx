import Link from "next/link";
import { ButtonLink } from "@oddmash/ui/button";
import localFont from "next/font/local";
import { JuliyaText } from "@oddmash/juliya/react";
import { CopyButton } from "../../components/copy-button";
import { FrameworkExamples } from "../../components/framework-examples";
import { LandingSpecimen } from "../../components/landing-specimen";
import { Playground } from "../../components/playground";
import { SiteButtonLink } from "../../components/site-navigation";
import "../landing.css";

const installCommand = "pnpm add @oddmash/juliya";
const display = localFont({
	src: "../fonts/kowrap-display.woff2",
	variable: "--landing-display",
	weight: "100 900",
	display: "swap",
	adjustFontFallback: false,
});

const Page = () => (
	<main id="main" className={`container landing ${display.variable}`}>
		<header className="landing-intro">
			<div className="hero-copy">
				<h1 id="hero-title">줄이야<span className="sr-only"> 다국어 줄바꿈 라이브러리</span></h1>
				<p className="hero-description">언어별 줄바꿈 경계와 화면 폭을 고려해 읽는 흐름을 지킵니다.</p>
				<div className="hero-actions">
					<SiteButtonLink className="button button-primary" href="/docs/">시작하기</SiteButtonLink>
					<ButtonLink className="button hero-secondary" variant="secondary" href="#editor">내 문장으로 체험하기</ButtonLink>
				</div>
			</div>
			<LandingSpecimen initialLocale="ko" />
			<a className="hero-scroll" href="#install" aria-label="설치 방법 보기"><span aria-hidden="true" /></a>
		</header>
		<section id="install" className="landing-install" aria-labelledby="install-title">
			<div className="section-copy">
				<p className="section-label">시작하기</p>
				<h2 id="install-title">한 줄의 설치.<br />기존 코드 그대로.</h2>
				<JuliyaText as="p">프레임워크에 맞는 API를 선택하고 텍스트에 적용하세요. 일반 문자열뿐 아니라 강조와 링크도 유지됩니다.</JuliyaText>
				<div className="install-command">
					<span className="command-prefix" aria-hidden="true">$</span>
					<code>{installCommand}</code>
					<CopyButton value={installCommand} className="icon-button" icon />
				</div>
			</div>
			<FrameworkExamples />
		</section>
		<section id="editor" className="landing-editor" aria-labelledby="playground-title" tabIndex={-1}>
			<div className="landing-section-heading">
				<p className="section-label">Playground</p>
				<h2 id="playground-title">내 문장으로 확인하기</h2>
				<p>텍스트, 폭, 글자 크기를 바꾸면 두 방식의 실제 줄바꿈이 바로 반영됩니다.</p>
			</div>
			<Playground />
			<Link className="text-link inline-guide-link" href="/docs/inline/">강조와 링크가 포함된 문장에 적용하기</Link>
		</section>
		<section className="landing-capabilities" aria-labelledby="capabilities-title">
			<h2 id="capabilities-title">쓰던 방식 그대로.</h2>
			<div className="capability-grid">
				<article><code>&lt;strong&gt; &lt;a&gt;</code><h3>기존 마크업 유지</h3><p>강조, 링크와 중첩 요소를 그대로 보존합니다.</p><Link href="/docs/inline/">인라인 마크업</Link></article>
				<article><code>width: 320px</code><h3>반응형 화면</h3><p>실제 글꼴과 컨테이너 크기에 따라 줄바꿈을 다시 계산합니다.</p><Link href="/docs/dom/">브라우저 API</Link></article>
				<article><code>SSR + CSR</code><h3>서버 렌더링</h3><p>초기 마크업을 유지하면서 브라우저에서 정확하게 측정합니다.</p><Link href="/docs/ssr/">SSR 가이드</Link></article>
			</div>
		</section>
		<section className="landing-end">
			<h2>읽기 좋은 다국어 문장을 만들어 보세요.</h2>
			<SiteButtonLink className="button button-primary" href="/docs/">문서 읽기</SiteButtonLink>
		</section>
	</main>
);

export default Page;
