import fixtures from "../../test/corpus/fixtures.json";
import type { SiteLocale } from "./locales";

export type CorpusFixture = (typeof fixtures)[number];
export const corpusFixtures = fixtures;
const representativeIds: Record<SiteLocale, string> = {
	ko: "ko-baettaragi",
	en: "en-frankenstein",
	ja: "ja-botchan",
	zh: "zh-red-chamber",
};
export const representativeFixtures = Object.values(representativeIds).map(id => {
	const fixture = fixtures.find(item => item.id === id);
	if (!fixture) throw new Error("Missing corpus representative: " + id);
	return fixture;
});
export const corpusMethodUrl = "https://github.com/Oddmash/juliya/blob/main/test/corpus/README.md";
