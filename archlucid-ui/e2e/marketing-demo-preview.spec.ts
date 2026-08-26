import { expect, test } from "@playwright/test";

import { showcaseTitleForRunId } from "@/lib/showcase-page-copy";

test.describe("marketing-demo-preview", () => {
  test("/showcase/customer-intake-modernization loads hero and signup CTA without auth", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/showcase/customer-intake-modernization", { waitUntil: "load" });
    await page.locator("#showcase-primary-content").waitFor({ state: "visible", timeout: 60_000 });
    await expect(
      page.getByRole("heading", {
        name: showcaseTitleForRunId("customer-intake-modernization"),
        level: 1,
      }),
    ).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.getByTestId("showcase-hero")).toBeVisible();
    // Showcase page renders outcome cards above the embedded demo body (replaces legacy result-at-a-glance band).
    await expect(page.getByRole("heading", { name: "At a glance" })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("showcase-outcome-cards")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("demo-preview-artifact-nav")).toBeVisible();
    await expect(page.getByTestId("demo-preview-sponsor-conclusion")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Review lifecycle" })).toBeVisible();
    await expect(page.locator('[data-testid="demo-preview-review-trail"]')).toBeVisible();

    const artifactNav = page.getByTestId("demo-preview-artifact-nav");
    await expect(artifactNav.getByRole("button", { name: /1 · Sponsor report/i })).toBeVisible();
    await expect(artifactNav.getByRole("button", { name: /2 · Sealed review record/i })).toBeVisible();

    await expect(page.getByTestId("showcase-bottom-cta")).toBeVisible();
    await expect(page.getByTestId("showcase-bottom-cta").getByRole("link", { name: "Start guided evaluation" })).toHaveAttribute(
      "href",
      "/signup",
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
