import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const version = process.env.RELEASE_VERSION;

if (!version || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
  throw new Error("RELEASE_VERSION must be a stable semantic version such as 0.1.0");
}

if (manifest.name !== "@oddmash/kowrap" || manifest.version !== version) {
  throw new Error(`Release mismatch: package is ${manifest.name}@${manifest.version}, requested ${version}`);
}

console.log(`Verified ${manifest.name}@${version}`);
