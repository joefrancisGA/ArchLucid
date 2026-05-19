import { expect, test } from "@playwright/test";

import { FIXTURE_LEFT_RUN_ID, FIXTURE_RIGHT_RUN_ID } from "../e2e/fixtures";
import {
  comparePageLeftRunInput,
  comparePageMainHeading,
  comparePageRightRunInput,
  expandCompareStructuredDecisionChanges,
  expandCompareTechnicalDetails,
  gotoComparePageWithFixturePair,
  structuredCompareSponsorRecommendationParagraph,
} from "../e2e/helpers/operator-journey";
import { registerDefaultPairLegacyStructuredCompare } from "../e2e/helpers/register-operator-api-routes";

/**
 * Manifest delta view (`/compare`) with deterministic mock payloads ({@link fixtureGoldenManifestComparison},
 * {@link fixtureLegacyRunComparison}). Merge-blocking via `playwright.mock.config.ts` chromium project.
 */
test.describe("Compare view — mocked manifest delta", () => {
  test("loads fixture pair, renders structured delta and legacy diff in headless mock CI", async ({ page }) => {
    await registerDefaultPairLegacyStructuredCompare(page);
    await gotoComparePageWithFixturePair(page);

    await expect(comparePageMainHeading(page)).toBeVisible();
    await expect(comparePageLeftRunInput(page)).toHaveValue(FIXTURE_LEFT_RUN_ID);
    await expect(comparePageRightRunInput(page)).toHaveValue(FIXTURE_RIGHT_RUN_ID);

    // `CompareForm` auto-runs compare when `leftRunId`/`rightRunId` are in the URL; wait for outcomes, not the submit control.
    await expect(page.locator("#compare-structured")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manifest comparison", level: 3 })).toBeVisible();

    await expect(structuredCompareSponsorRecommendationParagraph(page)).toBeVisible();

    await expandCompareStructuredDecisionChanges(page);
    await expect(page.locator("#compare-structured").getByText("claims.intake.boundary", { exact: true })).toBeVisible();

    await expandCompareTechnicalDetails(page);
    await expect(page.locator("#compare-legacy")).toBeVisible();
    await expect(page.getByRole("cell", { name: "topology", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "serviceCount", exact: true })).toBeVisible();
  });
});
