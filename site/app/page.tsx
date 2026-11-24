import Link from "next/link";
import { Fragment } from "react";
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

const useCases = [
	{ type: "article", label: "콘텐츠 제목", context: "읽기 흐름이 중요한 콘텐츠", text: "좋은 글은 보기 편한 화면에서 시작됩니다.", description: "제목의 의미 단위를 유지하면서 다음 줄의 균형을 맞춥니다." },
	{ type: "mobile", label: "모바일 카드", context: "폭이 좁은 서비스 소식", text: "새로운 기능을 지금 만나보세요.", description: "좁은 카드에서도 수식어와 이어지는 표현을 함께 읽을 수 있도록 배치합니다." },
	{ type: "mixed", label: "개발 문서", context: "한글과 영문이 섞인 인터페이스", text: "React와 TypeScript로 더 나은 UI를 만드세요.", description: "영문 기술 용어와 한국어 표현을 같은 화면에서 자연스럽게 배치합니다." },
] as const;

const caseWords = (text: string) => text.split(" ").map((word, i) => <Fragment key={i}>{i > 0 && " "}<span data-case-word={i}>{word}</span></Fragment>);

const UseCase = ({ item }: { item: typeof useCases[number] }) => (
	<article className={`use-case use-case-${item.type}`}>
		<div className="case-copy">
			<span className="case-index">{item.label}</span>
			<h3>{item.context}</h3>
			<p>{item.description}</p>
		</div>
		<div className="case-comparison">
			<div className="case-preview case-native">
				<span className="case-preview-label">기본 CSS</span>
				<div className="case-sample"><span className="case-label">{item.label}</span><p className="case-text">{caseWords(item.text)}</p></div>
			</div>
			<div className="case-preview case-applied">
				<span className="case-preview-label">Kowrap</span>
				<div className="case-sample"><span className="case-label">{item.label}</span><WrapText as="p" className="case-text">{caseWords(item.text)}</WrapText></div>
			</div>
		</div>
	</article>
);

const Page = () => (
	<main id="main" className={`container landing ${display.variable} ${mono.variable}`}>
		<header className="landing-intro">
			<div className="hero-copy">
				<p className="landing-kicker"><span aria-hidden="true" /> 한국어 줄바꿈 라이브러리</p>
				<WrapText as="h1" id="hero-title">한국어를 읽는 흐름에 맞춰.</WrapText>
				<p className="hero-description">같은 화면 폭에서도 읽기 흐름은 달라집니다. 어절과 문장의 의미를 함께 계산하는 오픈소스 줄바꿈 엔진입니다.</p>
				<div className="hero-actions">
					<a className="button button-primary" href="#editor">내 문장으로 체험하기 <span aria-hidden="true">↘</span></a>
					<Link className="hero-docs" href="/docs/">문서 보기 <span aria-hidden="true">↗</span></Link>
				</div>
			</div>
			<LandingSpecimen />
		</header>
		<div className="landing-proof-note">화면 속 실제 CSS 결과와 Kowrap 결과를 같은 문장, 글꼴, 폭으로 비교합니다.</div>
		<div id="editor" className="landing-editor" tabIndex={-1}>
			<div className="landing-section-heading">
				<h2>직접 써 보세요.</h2>
				<p>문장과 너비를 바꾸며 차이를 확인하세요.</p>
			</div>
			<Playground />
			<Link className="text-link inline-guide-link" href="/docs/inline/">강조, 링크가 포함된 문장에 적용하는 방법 →</Link>
		</div>
		<section className="landing-use-cases" aria-labelledby="use-cases-title">
			<div className="landing-section-heading">
				<h2 id="use-cases-title">실제 UI에서 달라지는 줄바꿈</h2>
				<p>콘텐츠 제목, 서비스 카드, 개발 문서의 적용 전후를 비교한 예시입니다.</p>
				<Link className="text-link" href="/comparison/">활용 사례와 성능 비교</Link>
			</div>
			<div className="use-case-grid">{useCases.map(item => <UseCase key={item.type} item={item} />)}</div>
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
