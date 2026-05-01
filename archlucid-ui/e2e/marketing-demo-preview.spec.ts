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
    await expect(page.getByRole("heading", { name: "Review trail" })).toBeVisible();
    await expect(page.locator('[data-testid="demo-preview-review-trail"]')).toBeVisible();
    await expect(page.getByText("Primary finding").first()).toBeVisible();

    const signup = page.locator('[data-testid="demo-preview-cta-signup"]');

    await expect(signup).toBeVisible();
    await expect(signup).toHaveAttribute("href", "/signup");
    await expect(page.getByTestId("demo-preview-signup-cta").getByRole("link", { name: "Getting started" })).toHaveAttribute(
      "href",
      "/get-started",
    );

    await expect(page.getByTestId("demo-preview-guided-callouts")).toBeVisible();
  });

  test("/see-it links to full demo preview with no-sign-in copy", async ({ page }) => {
    await page.goto("/see-it", { waitUntil: "load" });
    await page.locator("main").waitFor({ state: "visible", timeout: 60_000 });

    const demoCta = page.locator('[data-testid="see-it-cta-demo-preview"]');

    await expect(demoCta).toBeVisible();
    await expect(demoCta).toHaveAttribute("href", "/demo/preview");
    await expect(page.getByText(/no sign-in|no-sign-in/i)).toBeVisible();
  });
});
