import { expect, test } from "@playwright/test";

import { FIXTURE_LEFT_RUN_ID, FIXTURE_RIGHT_RUN_ID } from "./fixtures";
import {
  comparePageLeftRunInput,
  comparePageSubmitButton,
  expectComparisonRequestOutcomeVisible,
  gotoComparePageWithFixturePair,
} from "./helpers/operator-journey";
import { registerDefaultPairLegacyStructuredCompare } from "./helpers/register-operator-api-routes";

test.describe("operator journey — compare stale input warning", () => {
  test("shows when run IDs change after a successful compare, clears when values match last request again", async ({
    page,
  }) => {
    await registerDefaultPairLegacyStructuredCompare(page);
    await gotoComparePageWithFixturePair(page);

    await expect(comparePageSubmitButton(page)).toBeEnabled();
    await comparePageSubmitButton(page).click();
    await expectComparisonRequestOutcomeVisible(page);

    const leftInput = comparePageLeftRunInput(page);
    await leftInput.fill(`${FIXTURE_LEFT_RUN_ID}-edited`);

    const staleCallout = page.getByRole("status").filter({
      has: page.getByText("Selections no longer match the comparison shown here.", { exact: true }),
    });
    await expect(staleCallout).toBeVisible();
    await expect(staleCallout.getByText(/The comparison shown reflects/)).toBeVisible();
    await expect(staleCallout).toContainText(FIXTURE_LEFT_RUN_ID);
    await expect(staleCallout).toContainText(FIXTURE_RIGHT_RUN_ID);
    await expect(staleCallout.getByText(/restore the previous values/)).toBeVisible();

    await leftInput.fill(FIXTURE_LEFT_RUN_ID);
    await expect(
      page.getByText("Selections no longer match the comparison shown here.", { exact: true }),
    ).not.toBeVisible();
  });
});
