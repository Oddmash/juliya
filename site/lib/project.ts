const repository = process.env.NEXT_PUBLIC_BASE_PATH?.split("/").filter(Boolean).at(-1) ?? "juliya";

export const repositoryUrl = `https://github.com/Oddmash/${repository}`;
