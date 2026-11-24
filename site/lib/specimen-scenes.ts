import type { SiteLocale } from "./locales";
import { specimenText } from "./specimen";

type SpecimenScene = { text: string; widths: readonly [number, number, number] };

export const specimenScenes: Record<SiteLocale, readonly SpecimenScene[]> = {
	ko: [
		{ text: specimenText, widths: [10.8, 6.6, 12] },
		{ text: "오늘의 발견을 함께 나누는 작은 이야기", widths: [11.4, 8.1, 10.1] },
		{ text: "새로운 기능을 지금 만나보세요.", widths: [10.5, 7.7, 12.1] },
		{ text: "당신의 일상을 조금 더 특별하게", widths: [11.2, 8.6, 10.3] },
		{ text: "다음 여행을 위한 새로운 영감", widths: [10.2, 8.4, 11.8] },
		{ text: "작은 아이디어가 큰 변화를 만듭니다.", widths: [12, 8.8, 10.1] },
		{ text: "함께 일하는 방식을 더 간단하게", widths: [11, 7.9, 12.2] },
		{ text: "디자인에 집중할 수 있는 개발 환경", widths: [11.6, 9.1, 10.4] },
	],
	en: [
		{ text: "Build a better experience for everyone.", widths: [13, 9.8, 14.5] },
		{ text: "Make room for your next big idea.", widths: [12.8, 9.4, 13.4] },
		{ text: "The little details make a lasting difference.", widths: [14.4, 10.6, 12.7] },
		{ text: "A simpler way to work together.", widths: [12.1, 9.5, 14.1] },
		{ text: "Discover new stories in familiar places.", widths: [13.8, 10.1, 12.6] },
		{ text: "Bring your favorite ideas to life.", widths: [12.2, 9.3, 13.8] },
		{ text: "Create a space for the things that matter.", widths: [14.2, 10.8, 12.9] },
		{ text: "Your next adventure starts right here.", widths: [13.5, 9.9, 14.4] },
	],
	ja: [
		{ text: "読みやすい文章を、もっと自然に。", widths: [10.3, 7.2, 12.1] },
		{ text: "小さな発見から、新しい物語が始まる。", widths: [11.8, 8.4, 10.2] },
		{ text: "日々の暮らしに、ちょっとした彩りを。", widths: [11.2, 7.9, 12.3] },
		{ text: "大切なアイデアを、ひとつの場所に。", widths: [10.8, 8.1, 12] },
		{ text: "次の旅へ、新しい一歩を踏み出そう。", widths: [11.4, 8.5, 10.1] },
		{ text: "もっと自由に、あなたらしいデザインを。", widths: [12, 8.7, 10.6] },
		{ text: "一緒に働く時間を、もっと心地よく。", widths: [11.3, 7.6, 12.4] },
		{ text: "世界を変えるのは、小さなひらめき。", widths: [11.5, 8.8, 10.5] },
	],
	zh: [
		{ text: "让每一句话都读起来更加自然。", widths: [9.5, 6.9, 11.3] },
		{ text: "从今天的小发现，开启新的故事。", widths: [10.4, 7.7, 9.1] },
		{ text: "给日常生活增添一点不一样的色彩。", widths: [11.2, 8.3, 10.2] },
		{ text: "把重要的创意放在同一个地方。", widths: [10.5, 7.4, 11.6] },
		{ text: "每一次出发，都是全新的开始。", widths: [9.8, 7.1, 11.1] },
		{ text: "让每一个好点子，都有实现的机会。", widths: [11.5, 8.1, 10.3] },
		{ text: "让团队协作变得更加简单高效。", widths: [10, 7.6, 11.4] },
		{ text: "真正的改变，往往始于一个小小的想法。", widths: [12, 9, 10.8] },
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
