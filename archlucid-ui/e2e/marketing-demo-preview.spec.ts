/**
 * Public marketing `/demo/preview` and `/see-it` CTAs — static offline payload when API is unavailable (matches production fallback).
 */
import { expect, test } from "@playwright/test";

test.describe("marketing-demo-preview", () => {
  test("/demo/preview loads hero, result panel, artifact navigation, and signup CTA without auth", async ({ page }) => {
    await page.goto("/demo/preview", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "See a finalized architecture review", level: 1 })).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.getByTestId("demo-preview-result-at-a-glance")).toBeVisible();
    await expect(page.getByTestId("demo-preview-artifact-nav")).toBeVisible();
    await expect(page.getByTestId("demo-preview-executive-conclusion")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Review lifecycle" })).toBeVisible();
    await expect(page.locator('[data-testid="demo-preview-review-trail"]')).toBeVisible();

    const artifactNav = page.getByTestId("demo-preview-artifact-nav");
    await expect(artifactNav.getByRole("button", { name: /1 · Executive summary/i })).toBeVisible();
    await expect(artifactNav.getByRole("button", { name: /2 · Signed review record/i })).toBeVisible();

    const signup = page.locator('[data-testid="demo-preview-cta-signup"]');

    await expect(signup).toBeVisible();
    await expect(signup).toHaveAttribute("href", "/pricing#pricing-quote-request");
    await expect(page.getByTestId("demo-preview-signup-cta").getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/signin",
    );

    await expect(page.getByTestId("demo-preview-guided-callouts")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Review summary" })).toHaveCount(0);
  });

  test("/see-it Option A CTAs stay on primary customer intake showcase (no Contoso /demo/preview)", async ({ page }) => {
    await page.goto("/see-it", { waitUntil: "load" });
    await page.locator("main").waitFor({ state: "visible", timeout: 60_000 });

    await expect(page.locator('[data-testid="see-it-cta-demo-preview"]')).toHaveCount(0);
    await expect(page.locator('a[href="/demo/preview"]')).toHaveCount(0);

    const showcaseCta = page.locator('[data-testid="see-it-cta-showcase"]');

    await expect(showcaseCta).toHaveAttribute("href", "/showcase/customer-intake-modernization");
  });
});
