import { expect, test } from "@playwright/test";

import { START_REVIEW_PAGE_HEADING_PATTERN } from "./fixtures";

test.describe("first-run wizard", { tag: ["@founder", "@buyer-journey"] }, () => {
  test("new run page renders wizard shell", async ({ page }) => {
    await page.goto("/architecture/reviews/new");

    await expect(
      page.getByRole("heading", { name: START_REVIEW_PAGE_HEADING_PATTERN, level: 1 }),
    ).toBeVisible();
    await expect(page.getByTestId("reviews-new-path-switcher")).toBeVisible();
    await expect(page.getByTestId("reviews-new-job-chooser-section")).toBeVisible();
  });
});
