import { expect, test } from "@playwright/test";

import { FIXTURE_LEFT_RUN_ID, FIXTURE_RIGHT_RUN_ID, fixtureComparisonExplanation } from "./fixtures";
import {
  comparePageSubmitButton,
  comparePageSummarizeNarrativeButton,
  expandCompareRunPickersIfCollapsed,
  structuredCompareSponsorRecommendationParagraph,
} from "./helpers/operator-journey";
import { registerCompareAndExplainRoutes } from "./helpers/register-operator-api-routes";

test.describe("operator journey — compare proxy mocks", () => {
  test("client compare + explain calls are fulfilled without a live API", async ({ page }) => {
    await registerCompareAndExplainRoutes(page);

    const explainFixture = fixtureComparisonExplanation();

    const q = new URLSearchParams({
      leftRunId: FIXTURE_LEFT_RUN_ID,
      rightRunId: FIXTURE_RIGHT_RUN_ID,
    });
    await page.goto(`/compare?${q.toString()}`);

    const structuredSummary = structuredCompareSponsorRecommendationParagraph(page);

    if (!(await structuredSummary.isVisible())) {
      await expandCompareRunPickersIfCollapsed(page);
      const compareSubmit = comparePageSubmitButton(page);
      await expect(compareSubmit).toBeEnabled();
      await compareSubmit.click();
    }

    await expect(structuredSummary).toBeVisible();

    await expandCompareRunPickersIfCollapsed(page);
    await comparePageSummarizeNarrativeButton(page).click();
    await page.locator("#compare-ai summary").click();
    await expect(page.getByText(explainFixture.highLevelSummary)).toBeVisible();
  });
});
