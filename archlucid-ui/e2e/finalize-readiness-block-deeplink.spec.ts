import { expect, test } from "@playwright/test";

import { FIXTURE_RUN_ID } from "./fixtures/ids";
import { expectBuyerGoldenPageReady } from "./helpers/buyer-golden-path";
import { waitForAppReady } from "./helpers/waits";

test.describe(
  "finalize readiness block deep-links @demo-readiness",
  { tag: ["@founder", "@critical"] },
  () => {
    test("deferred scorecard block navigates to the deferred findings job view", async ({ page }) => {
      test.setTimeout(120_000);

      await page.goto(`/architecture/reviews/${encodeURIComponent(FIXTURE_RUN_ID)}`);

      await waitForAppReady(page);
      await expectBuyerGoldenPageReady(page);

      const blockedPanel = page.getByTestId("commit-blocked-finding-coverage");
      await expect(blockedPanel).toBeVisible({ timeout: 60_000 });
      await expect(blockedPanel).toContainText("Finalize is blocked");

      const action = page.getByTestId("finalize-readiness-block-action-scorecard");
      await expect(action).toBeVisible();
      await expect(action).toHaveAttribute(
        "href",
        `/architecture/reviews/${encodeURIComponent(FIXTURE_RUN_ID)}?reviewTab=findings&findingJobView=deferred`,
      );

      await action.click();

      await expect(page).toHaveURL(/findingJobView=deferred/);
      await expect(page.getByTestId("review-detail-workspace-panel-findings")).toBeVisible({ timeout: 60_000 });
    });
  },
);
