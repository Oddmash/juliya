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
			<h1 id="hero-title">한국어 줄바꿈을 자연스럽게</h1>
			<a href="#install">설치하기 <span aria-hidden="true">↘</span></a>
		</header>
		<LandingSpecimen />
		<details id="editor" className="landing-details">
			<summary>전체 편집기</summary>
			<Playground />
			<details className="landing-details inline-details">
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
		</details>
		<section id="install" className="landing-install" aria-labelledby="install-title">
			<div>
				<h2 id="install-title">설치</h2>
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
