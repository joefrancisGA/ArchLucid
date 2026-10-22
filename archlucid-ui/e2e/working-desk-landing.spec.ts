import { expect, test } from "@playwright/test";

import { ARCHITECTURES_LIST_PAGE_PRIMARY_HEADING_PATTERN } from "./fixtures";
import { getAppMain } from "./helpers/app-main";
import { waitForAppReady } from "./helpers/waits";

/**
 * SY-98 residual — mock E2E asserts Working desk landing is the architecture portfolio,
 * not the reviews inbox, unless a spec explicitly tests Inbox behavior.
 */
test.describe("working desk landing @working-desk", () => {
  test("architecture portfolio renders without generic error boundary @working-desk-landing", async ({ page }) => {
    await page.goto("/architecture/architectures");
    await waitForAppReady(page);

    await expect(
      page.getByRole("heading", { level: 2, name: ARCHITECTURES_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
  });
});
