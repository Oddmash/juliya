import { appendFileSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const tag = process.env.RELEASE_TAG;
const version = tag ? tag.slice(1) : process.env.RELEASE_VERSION;

if (!version || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
  throw new Error("RELEASE_VERSION must be a stable semantic version such as 0.1.0");
}

if (tag && tag !== `v${version}`) throw new Error("Release tags must use the vX.Y.Z format");

if (manifest.name !== "@oddmash/kowrap" || manifest.version !== version) {
  throw new Error(`Release mismatch: package is ${manifest.name}@${manifest.version}, requested ${version}`);
}

console.log(`Verified ${manifest.name}@${version}`);

if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
