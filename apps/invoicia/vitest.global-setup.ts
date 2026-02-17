import { execSync } from "node:child_process";

export default async function vitestGlobalSetup() {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      "postgresql://invoicia:invoicia@localhost:5433/invoicia?schema=test";
  }

  // Ensure the test schema has the latest migrations applied.
  execSync("pnpm prisma migrate deploy", { stdio: "inherit" });
}
