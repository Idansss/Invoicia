/**
 * Auth forms E2E tests (no login required).
 *
 * Covers: sign-in, sign-up, forgot-password page rendering,
 * client-side validation, link navigation between auth pages,
 * and the forgot-password success state.
 *
 * Note: shadcn/ui CardTitle renders as <div>, not a heading element,
 * so we use getByText() rather than getByRole("heading") for those.
 */
import { test, expect } from "@playwright/test";

// ─── Sign-in page ────────────────────────────────────────────────────────────

test.describe("Sign-in page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    // Wait for the client component to hydrate
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible({ timeout: 15_000 });
  });

  test("renders heading and form fields", async ({ page }) => {
    // CardTitle is a <div>, not an <h1>, so use getByText
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("'Forgot password?' link goes to /forgot-password", async ({ page }) => {
    // Use href-based selector to be resilient to exact text matching quirks
    await page.locator('a[href="/forgot-password"]').click();
    await expect(page).toHaveURL(/forgot-password/, { timeout: 10_000 });
  });

  test("'Sign up' link goes to /sign-up", async ({ page }) => {
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/sign-up/, { timeout: 10_000 });
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("nobody@example.invalid");
    await page.getByLabel("Password").fill("wrongpassword123");
    await page.getByRole("button", { name: "Sign in" }).click();
    // Next.js adds a __next-route-announcer__ with role="alert" — use .first()
    const errorAlert = page.getByRole("alert").filter({ hasText: /invalid/i });
    await expect(errorAlert).toBeVisible({ timeout: 15_000 });
  });
});

// ─── Sign-up page ─────────────────────────────────────────────────────────────

test.describe("Sign-up page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible({ timeout: 15_000 });
  });

  test("renders heading and all required form fields", async ({ page }) => {
    // CardTitle is a <div>, not an <h1>, so use getByText
    await expect(page.getByText(/create your account/i)).toBeVisible();
    await expect(page.getByLabel("First name")).toBeVisible();
    await expect(page.getByLabel("Last name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("shows client-side validation error when required fields are empty", async ({ page }) => {
    await page.getByRole("button", { name: /create account/i }).click();
    // Filter alerts to exclude the Next.js route announcer element
    const errorAlert = page.getByRole("alert").filter({ hasText: /required|name/i });
    await expect(errorAlert).toBeVisible({ timeout: 10_000 });
  });

  test("password strength indicator appears when typing a password", async ({ page }) => {
    await page.getByLabel("Password").fill("weakpw");
    await expect(page.getByText(/weak|fair|strong/i)).toBeVisible();
  });

  test("Google button is visually disabled with 'Coming soon' badge", async ({ page }) => {
    const googleBtn = page.getByRole("button", { name: /continue with google/i });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("'Sign in' link navigates to /sign-in", async ({ page }) => {
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 });
  });

  test("'Terms' link navigates to /terms", async ({ page }) => {
    await page.locator('a[href="/terms"]').click();
    await expect(page).toHaveURL(/\/terms/, { timeout: 10_000 });
  });

  test("'Privacy Policy' link navigates to /privacy", async ({ page }) => {
    await page.locator('a[href="/privacy"]').click();
    await expect(page).toHaveURL(/\/privacy/, { timeout: 10_000 });
  });
});

// ─── Forgot-password page ─────────────────────────────────────────────────────

test.describe("Forgot-password page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible({ timeout: 15_000 });
  });

  test("renders heading and email form", async ({ page }) => {
    // CardTitle is a <div>, not an <h1>, so use getByText
    await expect(page.getByText(/forgot password/i).first()).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });

  test("shows success state after submitting an email", async ({ page }) => {
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 20_000 });
  });

  test("'Sign in' link navigates to /sign-in", async ({ page }) => {
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 });
  });
});

// ─── Unauthenticated redirect tests ──────────────────────────────────────────

test.describe("Protected route redirects", () => {
  // /app is excluded here because it may trigger a Neon DB cold-start
  // (>30 s) during CI — it's covered by the dedicated slow test below.
  for (const route of ["/invoices", "/customers", "/products", "/settings"]) {
    test(`${route} redirects unauthenticated users to /sign-in`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/sign-in/, { timeout: 15_000 });
    });
  }

  test("/app redirects unauthenticated users to /sign-in", async ({ page }) => {
    // Neon DB cold-start can make this slow; use a generous navigation timeout
    await page.goto("/app", { timeout: 60_000 });
    await expect(page).toHaveURL(/sign-in/, { timeout: 15_000 });
  });
});
