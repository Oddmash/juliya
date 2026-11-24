const repository = process.env.NEXT_PUBLIC_BASE_PATH?.split("/").filter(Boolean).at(-1) ?? "kowrap";

export const repositoryUrl = `https://github.com/Oddmash/${repository}`;
