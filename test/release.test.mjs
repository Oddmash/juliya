import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isPublished } from "../scripts/check-published.mjs";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const validate = (env) => spawnSync(process.execPath, ["scripts/check-release.mjs"], {
  encoding: "utf8",
  env: { ...process.env, RELEASE_VERSION: "", RELEASE_TAG: "", GITHUB_OUTPUT: "", ...env },
});

test("release accepts exactly the manifest version and valid prefixed tags", () => {
  assert.equal(validate({ RELEASE_VERSION: version }).status, 0);
  assert.equal(validate({ RELEASE_TAG: `v${version}` }).status, 0);
  assert.notEqual(validate({ RELEASE_TAG: version }).status, 0);
  assert.notEqual(validate({ RELEASE_TAG: `v${version}-beta` }).status, 0);
  assert.notEqual(validate({ RELEASE_VERSION: "999.0.0" }).status, 0);
});

test("registry lookup detects existing versions and fails closed on invalid responses", async () => {
  const response = (status, body) => async () => new Response(JSON.stringify(body), { status });
  assert.equal(await isPublished("@oddmash/juliya", "0.1.0", response(200, { versions: { "0.1.0": {} } })), true);
  assert.equal(await isPublished("@oddmash/juliya", version, response(200, { versions: {} })), false);
  assert.equal(await isPublished("@oddmash/juliya", version, response(404, {})), false);
  await assert.rejects(isPublished("@oddmash/juliya", version, response(500, {})));
  await assert.rejects(isPublished("@oddmash/juliya", version, response(200, {})));
});

test("CI and release verify every integration browser", () => {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const browsers = ["chromium", "firefox", "webkit"];
  const integration = read("test/next-app/browser.mjs").match(/for \(const engine of \[([^\]]+)\]\)/);
  assert.ok(integration, "Integration must exercise each browser engine");
  assert.deepEqual(integration[1].split(",").map((name) => name.trim()).sort(), browsers);

  const imageVersion = (job) => job.match(/^\s*image: mcr\.microsoft\.com\/playwright:v([\d.]+)-noble@sha256:[a-f0-9]{64}$/m)?.[1];
  const publish = read(".github/workflows/publish.yml");
  assert.equal(imageVersion(publish), JSON.parse(read("test/next-app/package.json")).devDependencies.playwright);
  assert.doesNotMatch(publish, /playwright install --with-deps/);
  assert.match(publish, /^\s*- run: pnpm test:browser$/m);

  const ci = read(".github/workflows/ci.yml");
  const [core, site] = ci.split(/^  site:\s*$/m);
  assert.ok(site, "CI must include the site browser job");
  assert.equal(imageVersion(core), JSON.parse(read("test/next-app/package.json")).devDependencies.playwright);
  assert.equal(imageVersion(site), JSON.parse(read("site/package.json")).devDependencies.playwright);
  assert.match(core, /^\s*- run: pnpm test:browser$/m);
  const matrix = site.match(/^\s*browser: \[([^\]]+)\]$/m);
  assert.ok(matrix, "CI must test each site browser");
  assert.deepEqual(matrix[1].split(",").map((name) => name.trim()).sort(), browsers);
  assert.match(site, /run: pnpm --dir site test:browser "\$\{\{ matrix\.browser \}\}"/);
});

test("CI events avoid duplicate main push checks while deployment retains verification", () => {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const ci = read(".github/workflows/ci.yml");
  const ciEvents = ci.split("\nconcurrency:")[0];
  assert.match(ciEvents, /^  pull_request:/m);
  assert.match(ciEvents, /^  workflow_dispatch:/m);
  assert.doesNotMatch(ciEvents, /^  push:/m);
  assert.match(ci, /^  verify:\s*$/m);

  const pages = read(".github/workflows/pages.yml");
  assert.match(pages, /on:\n  push:\n    branches: \[main\]\n    paths:/);
  assert.match(pages, /^\s*- run: pnpm test:site$/m);
  assert.match(pages, /^\s*- run: pnpm --dir site test:browser$/m);
  assert.match(pages, /deploy:\n    if: github\.ref == 'refs\/heads\/main'\n    needs: build/);

  const publish = read(".github/workflows/publish.yml");
  assert.match(publish, /on:\n  release:\n    types: \[published\]/);
  for (const task of ["test", "test:hydration", "test:frameworks", "test:browser", "test:package"]) {
    assert.ok(publish.includes(`- run: pnpm ${task}\n`));
  }
  assert.match(publish, /publish:\n[^\n]+\n    needs: verify/);
  assert.match(publish, /id-token: write/);
  assert.match(publish, /npm publish .*--access public --ignore-scripts/);
});
