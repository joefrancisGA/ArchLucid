import { expect, test } from "@playwright/test";

import { SHOWCASE_DEMO_RUN_ID } from "./fixtures";
import { expectBuyerGoldenPageReady } from "./helpers/buyer-golden-path";
import { openReviewDetailWorkspaceTab } from "./helpers/operator-journey";
import { waitForAppReady } from "./helpers/waits";

/**
 * Desk continuity — changing review workspace tabs must not drop nested architecture routing when present.
 */
test.describe("working nested review tab contract @working-desk", () => {
  test("showcase review keeps pathname stable when switching workspace tabs", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(`/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);

    await waitForAppReady(page);
    await expectBuyerGoldenPageReady(page);

    const pathBefore = page.url();

    await openReviewDetailWorkspaceTab(page, SHOWCASE_DEMO_RUN_ID, "findings");

    await expect(page).toHaveURL(/reviewTab=findings/u);
    expect(page.url()).toContain(SHOWCASE_DEMO_RUN_ID);

    const nested = /\/architecture\/architectures\/[^/]+\/reviews\//u.test(pathBefore);

    if (nested) {
      expect(page.url()).toMatch(/\/architecture\/architectures\/[^/]+\/reviews\//u);
    }
  });
});
