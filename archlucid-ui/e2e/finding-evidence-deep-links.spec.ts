import { expect, test } from "@playwright/test";

import { SHOWCASE_DEMO_RUN_ID } from "./fixtures";
import { expectBuyerGoldenPageReady } from "./helpers/buyer-golden-path";
import { expandFindingWorkspaceCard, openReviewDetailWorkspaceTab } from "./helpers/operator-journey";
import { waitForAppReady } from "./helpers/waits";

const showcaseFindingId = "sensitive-data-minimization-risk";

test.describe(
  "finding evidence deep-links @demo-readiness",
  { tag: ["@founder", "@critical"] },
  () => {

  test("inspect panel links first evidence row to manifest summary section", async ({ page }) => {
    await page.goto(
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/findings/${encodeURIComponent(showcaseFindingId)}/evidence-trace`,
    );

    const manifestLink = page.getByTestId("finding-source-evidence-link").first();
    await expect(manifestLink).toBeVisible();
    await expect(manifestLink).toHaveAttribute(
      "href",
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}#manifest-summary`,
    );
  });

  test("run detail findings table exposes manifest navigation chip for showcase finding", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(`/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);

    await waitForAppReady(page);
    await expectBuyerGoldenPageReady(page);

    await openReviewDetailWorkspaceTab(page, SHOWCASE_DEMO_RUN_ID, "findings");

    const findingsPanel = page.getByTestId("review-detail-workspace-panel-findings");
    const showcaseCard = await expandFindingWorkspaceCard(findingsPanel, showcaseFindingId);
    const evidenceChip = showcaseCard.getByTestId("finding-evidence-link-chip");
    await evidenceChip.scrollIntoViewIfNeeded();
    await expect(evidenceChip).toBeVisible({ timeout: 60_000 });
    await expect(evidenceChip).toHaveAttribute(
      "href",
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}#manifest-summary`,
    );
  });
});
