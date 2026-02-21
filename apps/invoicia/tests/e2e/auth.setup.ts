/**
 * Auth setup – runs once before authenticated tests.
 *
 * Fills the sign-in form with the credentials stored in the environment
 * variables E2E_EMAIL / E2E_PASSWORD (add them to your .env file or pass
 * them inline).  The resulting session cookies are saved to
 * tests/e2e/.auth/user.json and reused by every test in the "authenticated"
 * project.
 *
 * If the env vars are not set the setup is skipped and the authenticated
 * project tests will be skipped too (they depend on this setup).
 */
import path from "node:path";
import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    console.warn(
      "\n⚠  E2E_EMAIL / E2E_PASSWORD env vars not set – skipping auth setup.\n" +
        "   Add them to your .env file to run authenticated tests.\n",
    );
    // Write an empty storage state so the dependent project doesn't crash
    await page.context().storageState({ path: AUTH_FILE });
    setup.skip(true, "E2E_EMAIL / E2E_PASSWORD not set");
    return;
  }

  await page.goto("/sign-in");
  // CardTitle is a <div>, not an <h1> — wait for the Sign in button to be ready
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  // Wait for the URL to change — page load can be slow due to DB cold-start,
  // so we commit navigation first and then wait for the app to finish loading.
  await Promise.all([
    page.waitForURL(/\/(app|invoices|customers|onboarding)/, {
      timeout: 90_000,
      waitUntil: "commit",
    }),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);

  // Give the app time to finish rendering after navigation
  await page.waitForLoadState("domcontentloaded");

  // Persist cookies + localStorage for reuse
  await page.context().storageState({ path: AUTH_FILE });
});
