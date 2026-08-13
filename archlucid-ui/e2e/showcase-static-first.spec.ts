import { expect, test } from "@playwright/test";

test.describe("Showcase static-first slug", () => {
  test("QuickNav keeps workspace deep links when demo static operator is enabled", async ({ page }) => {
    await page.goto("/showcase/claims-intake-modernization");

    const showcaseQuickNav = page.getByRole("region", { name: /Explore in workspace/i });
    await expect(showcaseQuickNav.getByRole("link", { name: "Review", exact: true })).toBeVisible();
    await expect(showcaseQuickNav.getByRole("link", { name: /Sign in to explore workspace/i })).toHaveCount(0);
  });

  test("renders curated body when marketing API returns 404 for claims-intake-modernization", async ({ page }) => {
    await page.route("**/v1/marketing/showcase/**", async (route) => {
      await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    });

    await page.goto("/showcase/claims-intake-modernization");

    await expect(page.getByRole("heading", { name: /Claims Intake Modernization/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Sponsor report/i })).toBeVisible();
    await expect(page.getByTestId("showcase-bottom-cta")).toBeVisible();
    await expect(page.getByText(/live preview/i)).toHaveCount(0);
  });
});
