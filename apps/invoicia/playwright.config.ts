import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "html",
  timeout: 90_000,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  projects: [
    // Auth setup project — runs once to log in and persist session
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",
    },
    // Authenticated tests — depend on setup having produced a saved session
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: "**/app.spec.ts",
    },
    // Public tests — no auth required, run independently
    {
      name: "public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: ["**/landing.spec.ts", "**/auth-forms.spec.ts"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: "development",
    },
  },
});
