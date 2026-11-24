import type { SiteLocale } from "./locales";

type SpecimenScene = { text: string; widths: readonly [number, number, number] };

export const specimenScenes: Record<SiteLocale, readonly SpecimenScene[]> = {
	ko: [
		{ text: "팀의 모든 문서를 한곳에서 관리하고 중요한 순간에 집중하세요.", widths: [10.8, 8.4, 12] },
		{ text: "오늘의 작은 발견을 함께 나누며 새로운 이야기의 시작을 만들어 보세요.", widths: [11.4, 8.6, 10.1] },
		{ text: "당신을 위해 준비한 새로운 기능을 만나고 더 편리한 하루를 시작하세요.", widths: [10.5, 8.3, 12.1] },
		{ text: "당신의 평범한 일상을 조금 더 특별하게 만들어 줄 새로운 경험을 만나세요.", widths: [11.2, 8.6, 10.3] },
		{ text: "익숙한 곳에서 발견한 새로운 영감으로 다음 여행의 이야기를 시작하세요.", widths: [10.2, 8.4, 11.8] },
		{ text: "작은 아이디어를 함께 나누는 순간 세상을 바꾸는 새로운 가능성이 열립니다.", widths: [12, 8.8, 10.1] },
		{ text: "함께 일하는 방식을 더 간단하게 만들고 소중한 일에 시간을 투자하세요.", widths: [11, 8.4, 12.2] },
		{ text: "디자인에 집중할 수 있는 개발 환경에서 당신만의 아이디어를 실현하세요.", widths: [11.6, 9.1, 10.4] },
	],
	en: [
		{ text: "Build a better experience for everyone, wherever they choose to read.", widths: [13, 10.1, 14.5] },
		{ text: "Make room for your next big idea and bring every detail into focus.", widths: [12.8, 10, 13.4] },
		{ text: "The little details make a lasting difference in the way we experience the world.", widths: [14.4, 11.1, 12.7] },
		{ text: "Discover a simpler way to work together and focus on what matters most.", widths: [12.1, 10.1, 14.1] },
		{ text: "Discover new stories in familiar places and share them with the people you love.", widths: [13.8, 11, 12.6] },
		{ text: "Bring your favorite ideas to life with space to explore and create.", widths: [12.2, 10, 13.8] },
		{ text: "Create a space for the things that matter and make every moment count.", widths: [14.2, 10.8, 12.9] },
		{ text: "Your next adventure starts right here, with a little curiosity and courage.", widths: [13.5, 10.4, 14.4] },
	],
	ja: [
		{ text: "読みやすい文章を、どんな画面でももっと自然に届けよう。", widths: [10.3, 8.2, 12.1] },
		{ text: "小さな発見から、新しい物語が始まる。その瞬間を大切にしよう。", widths: [11.8, 8.9, 10.2] },
		{ text: "日々の暮らしに、ちょっとした彩りを。新しい景色を見つけよう。", widths: [11.2, 8.6, 12.3] },
		{ text: "大切なアイデアを、ひとつの場所に集めて未来へつなげよう。", widths: [10.8, 8.5, 12] },
		{ text: "次の旅へ、新しい一歩を踏み出そう。まだ見ぬ景色が待っている。", widths: [11.4, 8.8, 10.1] },
		{ text: "もっと自由に、あなたらしいデザインで新しい可能性を広げよう。", widths: [12, 8.7, 10.6] },
		{ text: "一緒に働く時間を、もっと心地よく。大切なことに集中しよう。", widths: [11.3, 8.6, 12.4] },
		{ text: "世界を変えるのは、小さなひらめき。そこから未来が始まる。", widths: [11.5, 8.8, 10.5] },
	],
	zh: [
		{ text: "让每一句话都读起来更加自然，在不同的屏幕上保持清晰的阅读体验。", widths: [10.8, 8.7, 11.3] },
		{ text: "从今天的小发现开启新的故事，把每一个美好的瞬间分享给更多人。", widths: [10.4, 8.6, 11.1] },
		{ text: "给日常生活增添一点不一样的色彩，让平凡的每一天充满新的可能。", widths: [11.2, 8.6, 10.2] },
		{ text: "把重要的创意放在同一个地方，让团队的每一个灵感都产生价值。", widths: [10.5, 8.5, 11.6] },
		{ text: "每一次出发都是全新的开始，带着好奇心去探索更广阔的世界。", widths: [10.8, 8.2, 11.1] },
		{ text: "让每一个好点子都有实现的机会，用心创造属于自己的精彩故事。", widths: [11.5, 8.7, 10.3] },
		{ text: "让团队协作变得更加简单高效，把更多时间留给真正重要的事情。", widths: [10.8, 8.5, 11.4] },
		{ text: "真正的改变往往始于一个小小的想法，让今天成为新的起点。", widths: [12, 9, 10.8] },
	],
};

export const shuffledSceneIndices = (length: number, previous: number) => {
	const indices = Array.from({ length }, (_, index) => index).filter(index => index !== previous);
	for (let i = indices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[indices[i], indices[j]] = [indices[j], indices[i]];
	}
	return indices;
};
