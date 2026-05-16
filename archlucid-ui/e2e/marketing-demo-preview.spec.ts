/**
 * Public marketing `/demo/preview` and `/see-it` CTAs — static offline payload when API is unavailable (matches production fallback).
 */
import { expect, test } from "@playwright/test";

test.describe("marketing-demo-preview", () => {
  test("/demo/preview loads manifest narrative, outcome strip, and signup CTA without auth", async ({ page }) => {
    await page.goto("/demo/preview", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "See a finalized manifest (demo)", level: 1 })).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.getByRole("heading", { name: "Manifest summary" })).toBeVisible();
    // Default marketing chrome uses buyer-safe copy ("Review lifecycle timeline"); tooling/tests may use "Review trail".
    await expect(page.getByRole("heading", { name: /^(Review lifecycle timeline|Review trail)$/ })).toBeVisible();
    await expect(page.locator('[data-testid="demo-preview-review-trail"]')).toBeVisible();

    const outcomeStrip = page.getByRole("region", { name: "Open completed output" });
    await expect(outcomeStrip).toBeVisible();
    await expect(outcomeStrip.getByText(/1 · Executive summary/)).toBeVisible();
    await expect(outcomeStrip.getByText(/2 · Signed manifest/)).toBeVisible();

    const signup = page.locator('[data-testid="demo-preview-cta-signup"]');

    await expect(signup).toBeVisible();
    await expect(signup).toHaveAttribute("href", "/pricing#pricing-quote-request");
    await expect(page.getByTestId("demo-preview-signup-cta").getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/signin",
    );

    await expect(page.getByTestId("demo-preview-guided-callouts")).toBeVisible();
  });

  test("/see-it links to full demo preview with no-sign-in copy", async ({ page }) => {
    await page.goto("/see-it", { waitUntil: "load" });
    await page.locator("main").waitFor({ state: "visible", timeout: 60_000 });

    const demoCta = page.locator('[data-testid="see-it-cta-demo-preview"]');

    await expect(demoCta).toBeVisible();
    await expect(demoCta).toHaveAttribute("href", "/demo/preview");
    await expect(page.getByText("See a full sample review output — no sign-in")).toBeVisible();
  });
});
