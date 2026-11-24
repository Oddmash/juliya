import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const staging = await mkdtemp(resolve(tmpdir(), "juliya-package-"));
try {
  await cp(resolve(root, "dist"), resolve(staging, "dist"), { recursive: true });
  await cp(resolve(root, "README.md"), resolve(staging, "README.md"));
  const published = { ...manifest };
  delete published.scripts;
  delete published.devDependencies;
  delete published.packageManager;
  await writeFile(resolve(staging, "package.json"), JSON.stringify({ ...published, name: "@oddmash/juliya" }, null, 2) + "\n");
  const dryRun = process.argv.includes("--dry-run");
  const result = execFileSync("npm", ["pack", "--ignore-scripts", "--json", ...(dryRun ? ["--dry-run"] : ["--pack-destination", root])], { cwd: staging, encoding: "utf8" });
  const [packageInfo] = JSON.parse(result);
  if (packageInfo.name !== "@oddmash/juliya" || packageInfo.version !== manifest.version) throw new Error("Unexpected Juliya package identity");
  console.log(result.trim());
} finally {
  await rm(staging, { recursive: true, force: true });
}
