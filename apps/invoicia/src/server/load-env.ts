import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";

let hasLoaded = false;

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

  for (const dir of candidateDirs) {
    const hasEnvFile =
      fs.existsSync(path.join(dir, ".env")) || fs.existsSync(path.join(dir, ".env.local"));
    if (!hasEnvFile) continue;

    loadEnvConfig(
      dir,
      process.env.NODE_ENV !== "production",
      console,
      true, // Force reload so we can switch from app-local env to monorepo root env.
    );
    if (process.env.DATABASE_URL) return;
  }
}
