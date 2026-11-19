import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const original = "3dbe7355bdb18cf435391dbd73ad52385b04691a";
const git = (args, cwd = root) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const versionAt = (ref) => JSON.parse(git(["show", `${ref}:package.json`])).version;
const tagExists = (tag) => git(["tag", "--list", tag]) === tag;
const tagCommit = (tag) => git(["rev-parse", `${tag}^{commit}`]);

const createTag = (tag, ref, version) => {
  const commit = git(["rev-parse", `${ref}^{commit}`]);
  if (versionAt(commit) !== version) throw new Error(`${tag} does not match its package version`);
  if (tagExists(tag)) {
    if (tagCommit(tag) !== commit) throw new Error(`${tag} already points to a different commit; no tag was overwritten`);
    return;
  }
  git(["tag", "-a", tag, commit, "-m", `Release ${tag}`]);
  console.log(`Created ${tag} at ${commit.slice(0, 7)}`);
};

if (git(["branch", "--show-current"]) !== "main") throw new Error("Run from main");
if (git(["status", "--porcelain"])) throw new Error("Commit all intended release changes before preparing tags");
if (versionAt("HEAD") !== "0.2.0") throw new Error("Commit the 0.2.0 release first");
if (versionAt(original) !== "0.1.0") throw new Error("Original release commit does not match 0.1.0");

createTag("v0.1.0", original, "0.1.0");

if (tagExists("v0.1.1")) {
  if (versionAt("v0.1.1") !== "0.1.1") throw new Error("Existing v0.1.1 has a mismatched package version");
  if (git(["rev-parse", "v0.1.1^1"]) !== original) throw new Error("Existing v0.1.1 does not descend directly from the original release; no tag was overwritten");
} else {
  const directory = mkdtempSync(join(tmpdir(), "kowrap-release-0.1.1-"));
  git(["worktree", "add", "--detach", directory, original]);
  try {
    const manifestPath = join(directory, "package.json");
    const manifest = readFileSync(manifestPath, "utf8");
    writeFileSync(manifestPath, manifest.replace('"version": "0.1.0"', '"version": "0.1.1"'));
    if (JSON.parse(readFileSync(manifestPath, "utf8")).version !== "0.1.1") throw new Error("Unable to prepare patch package version");
    const files = [
      ".github/workflows/publish.yml",
      "scripts/check-release.mjs",
      "scripts/check-published.mjs",
      "docs/releases/v0.1.0.md",
      "docs/releases/v0.1.1.md",
    ];
    for (const file of files) {
      const destination = join(directory, file);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(root, file), destination);
    }
    git(["add", "package.json", ...files], directory);
    git(["commit", "-m", "chore(release): prepare v0.1.1 publishing maintenance"], directory);
    createTag("v0.1.1", git(["rev-parse", "HEAD"], directory), "0.1.1");
  } finally {
    try { git(["worktree", "remove", directory]); }
    catch { console.error(`Preserved incomplete release worktree: ${directory}`); }
  }
}

createTag("v0.2.0", "HEAD", "0.2.0");
console.log("All three local tags match their package versions. Push main and the explicit tags when ready.");
