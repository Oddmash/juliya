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
  assert.equal(await isPublished("@oddmash/kowrap", "0.1.0", response(200, { versions: { "0.1.0": {} } })), true);
  assert.equal(await isPublished("@oddmash/kowrap", version, response(200, { versions: {} })), false);
  assert.equal(await isPublished("@oddmash/kowrap", version, response(404, {})), false);
  await assert.rejects(isPublished("@oddmash/kowrap", version, response(500, {})));
  await assert.rejects(isPublished("@oddmash/kowrap", version, response(200, {})));
});
