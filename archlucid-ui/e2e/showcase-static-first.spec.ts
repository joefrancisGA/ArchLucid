import { expect, test } from "@playwright/test";

test.describe("Showcase static-first slug", () => {
  test("renders curated body when marketing API returns 404 for claims-intake-modernization", async ({ page }) => {
    await page.route("**/v1/marketing/showcase/**", async (route) => {
      await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    });

    await page.goto("/showcase/claims-intake-modernization");

    await expect(page.getByRole("heading", { name: /Claims Intake Modernization/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Executive summary/i })).toBeVisible();
    await expect(page.getByTestId("showcase-bottom-cta")).toBeVisible();
    await expect(page.getByText(/preview is not available/i)).toHaveCount(0);
  });
});
