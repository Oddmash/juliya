import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const isPublished = async (name, version, request = fetch) => {
  const response = await request(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: { accept: "application/vnd.npm.install-v1+json" },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Unable to verify npm release history: ${response.status}`);
  const { versions } = await response.json();
  if (!versions || typeof versions !== "object" || Array.isArray(versions)) throw new Error("Invalid npm version metadata");
  return Object.hasOwn(versions, version);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { name, version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const published = await isPublished(name, version);
  console.log(`${name}@${version} ${published ? "already exists on npm" : "is available to publish"}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `published=${published}\n`);
}
