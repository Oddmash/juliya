import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import manifest from "../../package.json";
import tokens from "../theme/tokens.json";
import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "kowrap | 한국어를 읽는 흐름대로",
		template: "%s | kowrap",
	},
	description:
		"어절을 보존하며 실제 화면 폭에 맞춰 자연스럽게 줄을 바꾸는 한국어 줄바꿈 엔진.",
};

const Logo = ({ size = 28 }: { size?: number }) => (
	<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
		<rect width="40" height="40" rx="6" fill="#171717" />
		<path d="M9 12h15l7 7-7 7H9l7-7z" fill="#ffffff" />
		<path d="M9 28h15" stroke="#999999" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

const theme = {
	"--paper": tokens.color.background,
	"--surface": tokens.color.surface,
	"--ink": tokens.color.text,
	"--muted": tokens.color.muted,
	"--border": tokens.color.border,
	"--control-border": tokens.color.controlBorder,
	"--action": tokens.color.action,
	"--action-hover": tokens.color.actionHover,
	"--focus": tokens.color.focus,
	"--danger": tokens.color.danger,
	"--sans": tokens.font.sans,
	"--mono": tokens.font.mono,
	"--radius-sm": tokens.radius.small,
	"--radius-md": tokens.radius.medium,
	"--radius-lg": tokens.radius.large,
} as CSSProperties;

const RootLayout = ({ children }: { children: ReactNode }) => (
	<html lang="ko" style={theme}>
		<body>
			<a className="skip-link" href="#main">
				본문 바로가기
			</a>
			<header className="header">
				<div className="nav container">
					<Link className="brand" href="/" aria-label="kowrap 홈">
						<Logo />
						kowrap<span className="version">v{manifest.version}</span>
					</Link>
					<nav className="nav-links" aria-label="주 메뉴">
						<Link href="/#playground" className="desktop-link">
							체험하기
						</Link>
						<Link href="/docs/">문서</Link>
						<a
							href="https://github.com/Oddmash/kowrap"
							target="_blank"
							rel="noopener noreferrer"
						>
							GitHub
						</a>
					</nav>
				</div>
			</header>
			{children}
			<footer className="footer container">
				<Link className="brand" href="/">
					<Logo size={23} />
					kowrap
				</Link>
				<span>Oddmash에서 만든 한국어 줄바꿈 라이브러리</span>
				<div>
					<a href="https://www.npmjs.com/package/@oddmash/kowrap">npm</a>
					<a href="https://github.com/Oddmash/kowrap">GitHub</a>
				</div>
			</footer>
		</body>
	</html>
);

export default RootLayout;
