import Link from "next/link";
import { CopyButton } from "../components/copy-button";
import { FrameworkExamples } from "../components/framework-examples";
import { Playground } from "../components/playground";

const Page = () => (
	<main id="main" className="container">
		<section className="hero" aria-labelledby="hero-title">
			<div className="hero-content">
				<p className="eyebrow">KOREAN LINE BREAKING LIBRARY</p>
				<h1 id="hero-title">
					문장은 그대로.
					<br />
					읽기는 <span>더 자연스럽게.</span>
				</h1>
				<p className="hero-description">
					어절은 지키고, 줄은 균형 있게. 실제 글자 폭과 한국어의 흐름을 고려하는
					프레임워크 독립 줄바꿈 엔진.
				</p>
			</div>
			<div className="hero-actions">
				<div className="install-command">
					<code>npm install @oddmash/kowrap</code>
					<CopyButton
						value="npm install @oddmash/kowrap"
						className="icon-button"
						icon
					/>
				</div>
				<Link className="button button-primary" href="/docs/">
					시작하기
				</Link>
			</div>
		</section>
		<Playground />
		<section className="principles" aria-labelledby="principles-title">
			<div>
				<p className="eyebrow">HOW IT WORKS</p>
				<h2 id="principles-title">
					글자의 폭부터
					<br />
					문장의 흐름까지.
				</h2>
			</div>
			<div className="principles-list">
				<div className="principle">
					<span className="principle-symbol" aria-hidden="true">
						가나
					</span>
					<div>
						<h3>어절을 보존합니다.</h3>
						<p>
							한글 어절과 Unicode grapheme을 기준으로 안전한 후보를 만들고, 너무
							긴 어절만 필요한 만큼 나눕니다.
						</p>
					</div>
				</div>
				<div className="principle">
					<span className="principle-symbol" aria-hidden="true">
						≋
					</span>
					<div>
						<h3>줄의 균형을 고릅니다.</h3>
						<p>
							같은 줄 수 안에서 남는 폭과 문장 경계를 비교해 짧은 마지막 줄을
							줄입니다.
						</p>
					</div>
				</div>
				<div className="principle">
					<span className="principle-symbol" aria-hidden="true">
						↵
					</span>
					<div>
						<h3>의도한 개행은 유지합니다.</h3>
						<p>
							명시적 개행과 강제 위치는 화면이 넓어지거나 좁아져도 그대로
							유지됩니다.
						</p>
					</div>
				</div>
			</div>
		</section>
		<section className="integration" aria-labelledby="integration-title">
			<div className="integration-description">
				<p className="eyebrow">ONE ENGINE, MANY ENVIRONMENTS</p>
				<h2 id="integration-title">어떤 프론트엔드에서도.</h2>
				<p>
					React, Next.js, Vue, Svelte와 일반 HTML. 하나의 코어를 필요한 환경에
					맞춰 사용하세요.
				</p>
				<Link className="text-link" href="/docs/">
					설치 및 프레임워크별 사용법
				</Link>
			</div>
			<FrameworkExamples />
		</section>
		<section className="docs-section" aria-labelledby="docs-title">
			<div>
				<p className="eyebrow">DOCUMENTATION</p>
				<h2 id="docs-title">더 깊이 살펴보기.</h2>
				<p>설치부터 서버 렌더링, 강제 개행, API 계약과 제한 사항까지.</p>
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
