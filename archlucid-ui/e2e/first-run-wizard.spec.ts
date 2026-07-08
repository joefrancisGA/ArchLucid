import { expect, test } from "@playwright/test";

import { CREATE_ARCHITECTURE_PAGE_HEADING_PATTERN } from "./fixtures";

test.describe("first-run wizard", () => {
  test("new run page renders wizard shell", async ({ page }) => {
    await page.goto("/reviews/new");

    await expect(
      page.getByRole("heading", { name: CREATE_ARCHITECTURE_PAGE_HEADING_PATTERN, level: 2 }),
    ).toBeVisible();
    await expect(page.getByTestId("reviews-new-path-toggle")).toBeVisible();
    await expect(page.getByTestId("reviews-new-path-guided-intake")).toBeVisible();
  });
});
