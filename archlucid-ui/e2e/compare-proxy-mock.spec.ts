import { expect, test } from "@playwright/test";

import { FIXTURE_LEFT_RUN_ID, FIXTURE_RIGHT_RUN_ID, fixtureComparisonExplanation } from "./fixtures";
import {
  comparePageSummarizeNarrativeButton,
  expandCompareRunPickersIfCollapsed,
  structuredCompareSponsorRecommendationParagraph,
  waitForCompareResultsReady,
} from "./helpers/operator-journey";
import { registerCompareAndExplainRoutes } from "./helpers/register-operator-api-routes";

test.describe("operator journey — compare proxy mocks", () => {
  test("client compare + explain calls are fulfilled without a live API", async ({ page }) => {
    test.setTimeout(90_000);
    await registerCompareAndExplainRoutes(page);

    const explainFixture = fixtureComparisonExplanation();

    const q = new URLSearchParams({
      leftRunId: FIXTURE_LEFT_RUN_ID,
      rightRunId: FIXTURE_RIGHT_RUN_ID,
    });
    await page.goto(`/insights/compare-two-reviews?${q.toString()}`);

    await waitForCompareResultsReady(page);

    const structuredSummary = structuredCompareSponsorRecommendationParagraph(page);
    await expect(structuredSummary).toBeVisible();

    await expandCompareRunPickersIfCollapsed(page);

    const collapsedPickers = page.locator("details").filter({ hasText: /Change compared reviews/i }).first();

    if ((await collapsedPickers.count()) > 0) {
      const isOpen: boolean = await collapsedPickers.evaluate((element) => (element as HTMLDetailsElement).open);

      if (!isOpen) {
        await collapsedPickers.locator(":scope > summary").click();
      }
    }

    const summarizeButton = comparePageSummarizeNarrativeButton(page);

    await expect(summarizeButton).toBeVisible({ timeout: 60_000 });
    await summarizeButton.scrollIntoViewIfNeeded();
    await summarizeButton.click();
    await page.locator("#compare-ai summary").click();
    await expect(page.getByText(explainFixture.highLevelSummary)).toBeVisible();
  });
});
