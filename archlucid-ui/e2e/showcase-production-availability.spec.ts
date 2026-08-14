import { expect, test, type Page } from "@playwright/test";

const claimsShowcasePath = "/showcase/customer-intake-modernization";

async function expectShowcaseMarketingBodyPresent(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: /Enterprise Customer Intake Modernization/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Executive summary/i })).toBeVisible();
  await expect(page.getByTestId("demo-preview-marketing-body")).toBeVisible();
  await expect(page.getByTestId("demo-preview-not-available")).toHaveCount(0);
  await expect(page.getByText(/not available on this site/i)).toHaveCount(0);
  await expect(page.getByText(/live preview/i)).toHaveCount(0);
}

test.describe(
  "Showcase production availability @release-smoke",
  { tag: ["@founder", "@release-smoke"] },
  () => {

  test("static-first slug serves marketing body without unavailable shell", async ({ page }) => {
    await page.goto(claimsShowcasePath);

    await expectShowcaseMarketingBodyPresent(page);
    await expect(page.getByTestId("showcase-bottom-cta")).toBeVisible();
  });

  test("static-first slug keeps curated body when marketing API returns 404", async ({ page }) => {
    await page.route("**/v1/marketing/showcase/**", async (route) => {
      await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    });

    await page.goto(claimsShowcasePath);

    await expectShowcaseMarketingBodyPresent(page);
    await expect(page.getByTestId("showcase-api-unavailable-banner")).toHaveCount(0);
  });
});
