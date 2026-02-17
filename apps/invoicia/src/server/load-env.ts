import fs from "node:fs";
import path from "node:path";

let hasLoaded = false;

function parseEnvLine(line: string): [string, string] | null {
  const withoutExport = line.replace(/^export\s+/, "");
  const match = withoutExport.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return null;

  const key = match[1];
  const rawValue = match[2];

  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    const unquoted = rawValue.slice(1, -1);
    const value = unquoted
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
    return [key, value];
  }

  if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
    return [key, rawValue.slice(1, -1)];
  }

  const value = rawValue.split(/\s+#/)[0]?.trimEnd() ?? "";
  return [key, value];
}

function loadEnvFile(filePath: string, initialEnvKeys: Set<string>) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const parsed = parseEnvLine(line);
    if (!parsed) continue;

    const [key, value] = parsed;
    if (initialEnvKeys.has(key)) continue;
    process.env[key] = value;
  }
}

export function ensureEnvLoaded() {
  if (hasLoaded) return;
  hasLoaded = true;

  // If env is already present (e.g. launched via root dotenv scripts), do nothing.
  if (process.env.DATABASE_URL) return;

  const cwd = process.cwd();
  const candidateDirs = [
    cwd,
    path.resolve(cwd, ".."),
    path.resolve(cwd, "../.."),
    path.resolve(cwd, "../../.."),
  ];
  const initialEnvKeys = new Set(Object.keys(process.env));

  for (const dir of candidateDirs) {
    const hasEnvFile =
      fs.existsSync(path.join(dir, ".env")) || fs.existsSync(path.join(dir, ".env.local"));
    if (!hasEnvFile) continue;

    loadEnvFile(path.join(dir, ".env"), initialEnvKeys);
    loadEnvFile(path.join(dir, ".env.local"), initialEnvKeys);
    if (process.env.DATABASE_URL) return;
  }
}
