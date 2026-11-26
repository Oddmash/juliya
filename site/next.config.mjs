const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default {
	output: "export",
	experimental: { globalNotFound: true },
	trailingSlash: true,
	basePath,
	images: { unoptimized: true },
	transpilePackages: ["@oddmash/juliya", "@oddmash/ui"],
};
