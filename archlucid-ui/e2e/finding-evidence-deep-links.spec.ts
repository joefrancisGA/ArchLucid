import { expect, test } from "@playwright/test";

import { SHOWCASE_DEMO_RUN_ID } from "./fixtures";
import { expectBuyerGoldenPageReady } from "./helpers/buyer-golden-path";
import { waitForAppReady } from "./helpers/waits";

const showcaseFindingId = "phi-minimization-risk";

test.describe("finding evidence deep-links @demo-readiness", () => {
  test("inspect panel links first evidence row to manifest summary section", async ({ page }) => {
    await page.goto(
      `/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/findings/${encodeURIComponent(showcaseFindingId)}/inspect`,
    );

    const manifestLink = page.getByTestId("finding-source-evidence-link").first();
    await expect(manifestLink).toBeVisible();
    await expect(manifestLink).toHaveAttribute(
      "href",
      `/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}#manifest-summary`,
    );
  });

  test("run detail findings table exposes manifest navigation chip for showcase finding", async ({ page }) => {
    await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);

    await waitForAppReady(page);
    await expectBuyerGoldenPageReady(page);

    const evidenceChip = page.getByTestId("finding-evidence-link-chip").first();
    await expect(evidenceChip).toBeVisible({ timeout: 60_000 });
    await expect(evidenceChip).toHaveAttribute(
      "href",
      `/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}#manifest-summary`,
    );
  });
});
