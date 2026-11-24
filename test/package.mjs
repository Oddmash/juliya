import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("published entrypoints exist and the tarball excludes development files", () => {
  const [pack] = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--ignore-scripts", "--json"], { encoding: "utf8" }));
  const files = new Set(pack.files.map(({ path }) => path));
  assert.equal(pack.name, manifest.name);
  assert.equal(pack.version, manifest.version);
  for (const entry of Object.values(manifest.exports)) {
    assert.ok(files.has(entry.types.slice(2)));
    assert.ok(files.has(entry.import.slice(2)));
  }
  assert.ok(files.has("README.md"));
  assert.ok(files.has("package.json"));
  assert.ok([...files].every((file) => file.startsWith("dist/") || /^(README\.md|LICENSE(?:\..+)?|package\.json)$/.test(file)));
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(manifest.publishConfig.registry, "https://registry.npmjs.org/");
  assert.equal(Object.keys(manifest.dependencies ?? {}).length, 0);
});

test("Juliya package candidate exports the same implementation and locale paths", () => {
  const [pack] = JSON.parse(execFileSync(process.execPath, ["scripts/pack-juliya.mjs", "--dry-run"], { encoding: "utf8" }));
  assert.equal(pack.name, "@oddmash/juliya");
  assert.equal(pack.version, manifest.version);
  const files = new Set(pack.files.map(({ path }) => path));
  for (const entry of Object.values(manifest.exports)) {
    assert.ok(files.has(entry.types.slice(2)));
    assert.ok(files.has(entry.import.slice(2)));
  }
});
