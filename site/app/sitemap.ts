import type { MetadataRoute } from "next";
import { getGuides, guideHref } from "../lib/guides";
import { languages, languagePath } from "../lib/locales";
import { translatedGuideSlugs } from "../lib/translated-guides";

export const dynamic = "force-static";

const origin = "https://oddmash.github.io/juliya";
export default function sitemap(): MetadataRoute.Sitemap {
	const routes = languages.flatMap(language => {
		const prefix = languagePath(language);
		const slugs = language === "ko" ? getGuides().map(guide => guide.slug) : translatedGuideSlugs;
		return [prefix + "/", ...slugs.map(slug => prefix + guideHref(slug))];
	});
	return [...routes, "/comparison/"].map(route => ({ url: origin + route }));
}
