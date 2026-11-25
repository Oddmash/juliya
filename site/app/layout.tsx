import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import manifest from "../../package.json";
import tokens from "../theme/tokens.json";
import { SiteNavigation } from "../components/site-navigation";
import { SiteBrand } from "../components/site-brand";
import { SiteHeader, SiteHeaderInner, SiteFooter, SiteNav } from "@oddmash/ui/site-layout";
import { PlatformLink, PlatformLinks } from "@oddmash/ui/platform-link";
import { CopyToastProvider } from "../components/copy-toast";
import { getGuides, guideHref } from "../lib/guides";
import { repositoryUrl } from "../lib/project";
import "@oddmash/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "줄이야 (Juliya) | 자연스러운 다국어 줄바꿈",
		template: "%s | Juliya",
	},
	description:
		"한국어, 영어, 일본어, 중국어의 문장과 실제 화면 폭을 고려하는 줄바꿈 엔진.",
};

const Logo = ({ size = 28 }: { size?: number }) => (
	<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
		<rect width="40" height="40" rx="6" fill="var(--action)" />
		<path d="M9 12h15l7 7-7 7H9l7-7z" fill="var(--action-text)" />
		<path d="M9 28h15" stroke="var(--action-text)" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

const theme = {
	"--paper": tokens.color.background,
	"--surface": tokens.color.surface,
	"--surface-raised": tokens.color.surfaceRaised,
	"--surface-inset": tokens.color.surfaceInset,
	"--surface-hover": tokens.color.surfaceHover,
	"--ink": tokens.color.text,
	"--muted": tokens.color.muted,
	"--subtle": tokens.color.subtle,
	"--border": tokens.color.border,
	"--control-border": tokens.color.controlBorder,
	"--action": tokens.color.action,
	"--action-hover": tokens.color.actionHover,
	"--action-text": tokens.color.actionText,
	"--accent-tint": tokens.color.accentTint,
	"--syntax-keyword": tokens.color.syntaxKeyword,
	"--syntax-string": tokens.color.syntaxString,
	"--syntax-number": tokens.color.syntaxNumber,
	"--focus": tokens.color.focus,
	"--danger": tokens.color.danger,
	"--sans": tokens.font.sans,
	"--mono": tokens.font.mono,
	"--radius-sm": tokens.radius.small,
	"--radius-md": tokens.radius.medium,
	"--radius-lg": tokens.radius.large,
} as CSSProperties;

const RootLayout = ({ children }: { children: ReactNode }) => (
	<html lang="ko" data-om-theme="dark" style={theme}>
		<body>
			<CopyToastProvider>
			<a className="skip-link" href="#main">
				본문 바로가기
			</a>
			<SiteHeader className="header">
				<SiteHeaderInner className="nav container">
					<SiteBrand version={manifest.version}><Logo /></SiteBrand>
					<SiteNavigation items={getGuides().map(({ slug, title, group, body }) => ({ slug, title, group, body, href: guideHref(slug) }))} />
				</SiteHeaderInner>
			</SiteHeader>
			{children}
			<SiteFooter className="footer container">
				<SiteBrand><Logo size={23} /></SiteBrand>
				<SiteNav className="footer-links" aria-label="Oddmash">
					<a href="https://github.com/Oddmash">Oddmash</a>
					<PlatformLinks>
						<PlatformLink platform="npm" href="https://www.npmjs.com/package/@oddmash/juliya" aria-label="npm" title="npm" />
						<PlatformLink platform="github" href={repositoryUrl} aria-label="GitHub" title="GitHub" />
					</PlatformLinks>
				</SiteNav>
			</SiteFooter>
			</CopyToastProvider>
		</body>
	</html>
);

export default RootLayout;
