import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseDotenv(content) {
  const out = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2] ?? "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

function pnpmCmd() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

const repoRoot = process.cwd();
const appDir = path.join(repoRoot, "apps", "invoicia");
const schemaPath = path.join(appDir, "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.warn(`[prisma-generate] schema not found at ${schemaPath}; skipping`);
  process.exit(0);
}

const env = { ...process.env };

// Ensure Prisma can parse datasource even when DATABASE_URL isn't exported in the shell.
if (!env.DATABASE_URL) {
  const envPath = path.join(repoRoot, ".env");
  if (fs.existsSync(envPath)) {
    try {
      const parsed = parseDotenv(fs.readFileSync(envPath, "utf8"));
      if (parsed.DATABASE_URL) env.DATABASE_URL = parsed.DATABASE_URL;
    } catch {
      // ignore
    }
  }
}
if (!env.DATABASE_URL) {
  // Prisma doesn't connect during generate; it just needs a syntactically valid URL.
  env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db?schema=public";
}

const result = spawnSync(
  pnpmCmd(),
  ["-C", appDir, "exec", "prisma", "generate", "--schema=./prisma/schema.prisma"],
  { stdio: "inherit", env },
);

process.exit(result.status ?? 1);

