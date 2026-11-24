export const languages = ["ko", "en", "ja", "zh"] as const;
export type SiteLocale = typeof languages[number];
export const languageNames = { ko: "한국어", en: "English", ja: "日本語", zh: "简体中文" };
export const languagePath = (locale: SiteLocale) => locale === "ko" ? "" : `/${locale}`;
export const engineLocale = (locale: SiteLocale) => locale === "zh" ? "zh-Hans" : locale;
export const languageFromPath = (pathname: string): SiteLocale => {
	const first = pathname.split("/")[1];
	return languages.find(locale => locale === first) ?? "ko";
};

export const landingCopy = {
	ko: {
		title: "줄이야", description: "언어별 줄바꿈 경계와 화면 폭을 고려해 읽는 흐름을 지킵니다.",
		start: "시작하기", try: "내 문장으로 체험하기", docs: "문서", search: "문서 검색", close: "닫기", noResults: "검색 결과가 없습니다.",
		install: "한 줄의 설치. 기존 코드 그대로.", installDescription: "프레임워크에 맞는 API를 선택하고 텍스트에 적용하세요. 일반 문자열뿐 아니라 강조와 링크도 유지됩니다.",
		editor: "내 문장으로 확인하기", editorDescription: "텍스트, 폭, 글자 크기를 바꾸면 두 방식의 실제 줄바꿈이 바로 반영됩니다.",
		capabilities: "쓰던 방식 그대로.", markup: "기존 마크업 유지", markupDescription: "강조, 링크와 중첩 요소를 그대로 보존합니다.", responsive: "반응형 화면", responsiveDescription: "글꼴과 컨테이너 크기에 맞춰 다시 계산합니다.", ssr: "서버 렌더링", ssrDescription: "초기 마크업을 유지하고 브라우저에서 측정합니다.", end: "읽기 좋은 문장을 만들어 보세요.", read: "문서 읽기",
	},
	en: {
		title: "Juliya", description: "Wrap text around language-aware boundaries and the actual width of your layout.",
		start: "Get started", try: "Try your own text", docs: "Docs", search: "Search docs", close: "Close", noResults: "No results found.",
		install: "One install. Your existing code.", installDescription: "Choose your framework and preserve plain text, emphasis and links.",
		editor: "Try your own text", editorDescription: "Change the text, width or font size to see both layouts update.",
		capabilities: "Keep the way you work.", markup: "Preserve markup", markupDescription: "Keep emphasis, links and nested elements.", responsive: "Responsive layouts", responsiveDescription: "Recalculate with the actual font and container width.", ssr: "Server rendering", ssrDescription: "Preserve initial markup and measure in the browser.", end: "Make every line easier to read.", read: "Read the docs",
	},
	ja: {
		title: "Juliya", description: "言語ごとの改行境界と実際の画面幅を考慮し、読みやすい文章を作ります。",
		start: "はじめる", try: "文章を試す", docs: "ドキュメント", search: "検索", close: "閉じる", noResults: "検索結果がありません。",
		install: "インストールは一行。既存のコードはそのまま。", installDescription: "フレームワークに合うAPIを選び、強調やリンクも保持できます。",
		editor: "自分の文章で確認", editorDescription: "文章、幅、文字サイズを変更すると両方の改行結果が更新されます。",
		capabilities: "いつもの開発スタイルで。", markup: "マークアップを保持", markupDescription: "強調、リンク、入れ子の要素を保持します。", responsive: "レスポンシブ対応", responsiveDescription: "フォントとコンテナの幅に合わせて再計算します。", ssr: "サーバーレンダリング", ssrDescription: "初期マークアップを保持し、ブラウザで測定します。", end: "もっと読みやすい文章を。", read: "ドキュメントを読む",
	},
	zh: {
		title: "Juliya", description: "依据不同语言的换行边界和实际排版宽度，让每句话自然易读。",
		start: "开始使用", try: "试试你的文本", docs: "文档", search: "搜索文档", close: "关闭", noResults: "未找到结果。",
		install: "一行安装。保留现有代码。", installDescription: "选择适合你的框架，保留文本、强调和链接。",
		editor: "使用自己的文本体验", editorDescription: "修改文本、宽度和字号，即可看到两种换行结果。",
		capabilities: "保持熟悉的开发方式。", markup: "保留标记", markupDescription: "保留强调、链接和嵌套元素。", responsive: "响应式布局", responsiveDescription: "根据字体和容器的实际宽度重新计算。", ssr: "服务端渲染", ssrDescription: "保留初始标记并在浏览器中测量。", end: "让每一行更容易阅读。", read: "阅读文档",
	},
} as const;
