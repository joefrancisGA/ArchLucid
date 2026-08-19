import { expect, test } from "@playwright/test";

import {
  FIXTURE_COMPARE_STALE_PRIMARY_LABEL_LEFT_ALT,
  FIXTURE_COMPARE_STALE_PRIMARY_LABEL_LEFT_BASELINE,
  FIXTURE_LEFT_RUN_ID,
  FIXTURE_RIGHT_RUN_ID,
} from "./fixtures";
import {
  expectComparisonRequestOutcomeVisible,
  gotoComparePageWithFixturePair,
  selectCompareLeftRunOptionByPrimaryLabel,
} from "./helpers/operator-journey";
import { registerCompareStaleInputWarningRoutes } from "./helpers/register-operator-api-routes";

test.describe("operator journey — compare stale input warning", () => {
  test("shows when run IDs change after a successful compare, clears when values match last request again", async ({
    page,
  }) => {
    await registerCompareStaleInputWarningRoutes(page);
    await gotoComparePageWithFixturePair(page);

    // `CompareForm` auto-runs compare when both run ids are in the URL; the submit control stays disabled until that finishes.
    await expectComparisonRequestOutcomeVisible(page);

    await selectCompareLeftRunOptionByPrimaryLabel(page, FIXTURE_COMPARE_STALE_PRIMARY_LABEL_LEFT_ALT);

    const staleCallout = page.getByRole("status").filter({
      has: page.getByText("Selections no longer match the comparison shown here.", { exact: true }),
    });
    await expect(staleCallout).toBeVisible();
    await expect(staleCallout.getByText(/The comparison shown reflects/)).toBeVisible();
    await expect(staleCallout).toContainText(FIXTURE_LEFT_RUN_ID);
    await expect(staleCallout).toContainText(FIXTURE_RIGHT_RUN_ID);
    await expect(staleCallout.getByText(/restore the previous values/)).toBeVisible();

    await selectCompareLeftRunOptionByPrimaryLabel(page, FIXTURE_COMPARE_STALE_PRIMARY_LABEL_LEFT_BASELINE);
    await expect(
      page.getByText("Selections no longer match the comparison shown here.", { exact: true }),
    ).not.toBeVisible();
  });
});
