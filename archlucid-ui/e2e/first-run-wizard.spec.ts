import { expect, test } from "@playwright/test";

test.describe("first-run wizard", () => {
  test("new run page renders wizard shell", async ({ page }) => {
    await page.goto("/reviews/new");

    await expect(page.getByRole("heading", { name: /new architecture review/i, level: 2 })).toBeVisible();
    await expect(page.getByText(/Just exploring\?/i)).toBeVisible();
    await expect(page.getByTestId("reviews-new-path-toggle")).toBeVisible();
  });
});
