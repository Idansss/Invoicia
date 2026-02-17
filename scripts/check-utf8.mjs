import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { TextDecoder } from "node:util";

const decoder = new TextDecoder("utf-8", { fatal: true });
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".md"]);
const skipDirectories = new Set(["node_modules", ".next", "dist", "build", ".turbo"]);

const repoRoot = process.cwd();
const appsRoot = path.join(repoRoot, "apps");
const roots = ["apps/invoicia/src"];

try {
  const appEntries = await readdir(appsRoot, { withFileTypes: true });
  for (const entry of appEntries) {
    if (!entry.isDirectory()) continue;
    const srcDir = path.join("apps", entry.name, "src");
    if (!roots.includes(srcDir)) {
      roots.push(srcDir);
    }
  }
} catch {
  // If apps/ is not readable, we still check the default root.
}

const invalidFiles = [];

for (const root of roots) {
  const absoluteRoot = path.join(repoRoot, root);
  await walkDirectory(absoluteRoot);
}

if (invalidFiles.length > 0) {
  console.error("Invalid UTF-8 files detected:");
  for (const file of invalidFiles) {
    console.error(` - ${path.relative(repoRoot, file)}`);
  }
  process.exit(1);
}

console.log(`UTF-8 check passed (${roots.length} roots scanned).`);

async function walkDirectory(directoryPath) {
  let entries;
  try {
    entries = await readdir(directoryPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (!skipDirectories.has(entry.name)) {
        await walkDirectory(fullPath);
      }
      continue;
    }

    if (!allowedExtensions.has(path.extname(entry.name))) {
      continue;
    }

    try {
      const buffer = await readFile(fullPath);
      decoder.decode(buffer);
    } catch {
      invalidFiles.push(fullPath);
    }
  }
}
