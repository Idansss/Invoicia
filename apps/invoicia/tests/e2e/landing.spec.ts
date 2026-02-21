/**
 * Landing page E2E tests.
 *
 * Covers: page load, navigation bar, hero section, CTA links,
 * pricing section, footer links, terms and privacy pages.
 */
import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Invoicia/i);
  });

  test("brand name is visible in the header area", async ({ page }) => {
    // The landing page brand is rendered in a header/div, not a <nav> element
    await expect(page.getByText("Invoicia").first()).toBeVisible();
  });

  test("primary CTA navigates to sign-up", async ({ page }) => {
    // The first prominent 'Get started' or 'Start free' button
    const cta = page
      .getByRole("link", { name: /get started|start free/i })
      .first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/sign-up/);
  });

  test("'Sign in' link in navbar navigates to sign-in page", async ({ page }) => {
    await page.getByRole("link", { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/sign-in/);
  });

  test("nav link 'Pricing' scrolls to pricing section", async ({ page }) => {
    await page.getByRole("link", { name: "Pricing" }).first().click();
    await expect(page.locator("#pricing")).toBeInViewport({ ratio: 0.1 });
  });

  test("pricing section has three tier cards", async ({ page }) => {
    const section = page.locator("#pricing");
    await expect(section).toBeVisible();

    // Each plan card contains the plan name
    for (const plan of ["Starter", "Professional", "Enterprise"]) {
      await expect(section.getByText(plan)).toBeVisible();
    }
  });

  test("'How it works' nav link scrolls to that section", async ({ page }) => {
    await page.getByRole("link", { name: "How it works" }).first().click();
    await expect(page.locator("#how-it-works")).toBeInViewport({ ratio: 0.1 });
  });

  test("footer contains expected column headings", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    for (const heading of ["Product", "Company", "Legal"]) {
      await expect(footer.getByText(heading)).toBeVisible();
    }
  });

  test("footer 'Terms' link navigates to /terms", async ({ page }) => {
    await page.locator("footer").getByRole("link", { name: /terms/i }).click();
    await expect(page).toHaveURL(/\/terms/);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("footer 'Privacy' link navigates to /privacy", async ({ page }) => {
    await page.locator("footer").getByRole("link", { name: /privacy/i }).click();
    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
