import { expect, test } from "@playwright/test";

test.describe("first-run wizard", () => {
  test("new run page renders wizard shell", async ({ page }) => {
    await page.goto("/reviews/new");

    await expect(page.getByRole("heading", { name: /new architecture review/i, level: 2 })).toBeVisible();
    await expect(
      page.getByText(/Use Quick start when you already have an architecture brief or evidence file/i),
    ).toBeVisible();
    await expect(page.getByTestId("reviews-new-more-intake-options")).toBeVisible();
    await page.getByTestId("reviews-new-more-intake-options").click();
    await expect(page.getByTestId("reviews-new-path-toggle")).toBeVisible();
    await expect(page.getByTestId("reviews-new-path-guided-intake")).toBeVisible();
  });
});
