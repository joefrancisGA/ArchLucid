import { expect, test } from "@playwright/test";

import { FIXTURE_LEFT_RUN_ID, FIXTURE_RIGHT_RUN_ID } from "./fixtures";
import {
  comparePageLeftRunInput,
  comparePageMainHeading,
  comparePageRightRunInput,
  comparePageSubmitButton,
  comparePageSummarizeNarrativeButton,
  comparisonRequestOutcomePanel,
  expandComparisonRequestOutcome,
  expandCompareRunPickersIfCollapsed,
  expandCompareTechnicalDetails,
  expectComparisonRequestOutcomeVisible,
  gotoComparePageWithFixturePair,
  structuredCompareSponsorRecommendationParagraph,
} from "./helpers/operator-journey";
import { registerDefaultPairLegacyStructuredCompare } from "./helpers/register-operator-api-routes";

test.describe("operator journey — compare query prefill and review order", () => {
  test("prefills from URL, runs legacy then structured mocks, shows review order and last request summary", async ({
    page,
  }) => {
    await registerDefaultPairLegacyStructuredCompare(page);
    await gotoComparePageWithFixturePair(page);

    await expect(comparePageLeftRunInput(page)).toHaveValue(FIXTURE_LEFT_RUN_ID);
    await expect(comparePageRightRunInput(page)).toHaveValue(FIXTURE_RIGHT_RUN_ID);

    await expect(comparePageMainHeading(page)).toBeVisible();
    await expect(
      page.getByText(/review the structured summary first|The structured summary below is the authoritative/i),
    ).toBeVisible();
    // URL pair triggers auto-compare; buyer-polished shell then folds pickers below results (`collapseBelowResults`).
    await expandCompareRunPickersIfCollapsed(page);
    await expect(comparePageSummarizeNarrativeButton(page)).toBeVisible();

    await expect(comparePageSubmitButton(page)).toBeEnabled();
    await comparePageSubmitButton(page).click();
    await expectComparisonRequestOutcomeVisible(page);

    await expect(page.getByRole("heading", { name: "Manifest comparison", level: 3 })).toBeVisible();
    await expect(page.locator("#compare-structured")).toBeVisible();
    await expect(structuredCompareSponsorRecommendationParagraph(page)).toBeVisible();

    await expandCompareTechnicalDetails(page);
    await expect(page.getByRole("heading", { name: "Review-level diff", level: 3 })).toBeVisible();
    await expect(page.locator("#compare-legacy")).toBeVisible();
    await expect(page.getByRole("cell", { name: "topology", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "serviceCount", exact: true })).toBeVisible();

    // Mock `playwright.mock.config.ts` defaults to demo/static-operator env → buyer-polished shell hides the
    // outline `<nav>` (`CompareResultsPanel`: `hasResultsToNavigate && !buyerPolished`). Full-operator builds
    // (`NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`) still render it.
    const reviewNav = page.getByRole("navigation", { name: "Comparison results outline" });

    if ((await reviewNav.count()) > 0) {
      await expect(reviewNav.getByText("Review order", { exact: true })).toBeVisible();
      await expect(reviewNav.getByRole("link", { name: "Manifest comparison summary" })).toBeVisible();
      await expect(reviewNav.getByRole("link", { name: "Manifest diff appendix" })).toBeVisible();
      await expect(reviewNav.getByRole("link", { name: "Technical details (supplementary diff)" })).toBeVisible();
    } else {
      await expect(page.getByTestId("compare-raw-manifest-diff")).toBeVisible();
    }

    await expandComparisonRequestOutcome(page);

    const outcome = comparisonRequestOutcomePanel(page);
    await expect(outcome.getByText(/Last compare request \(technical\)/)).toBeVisible();
    await expect(outcome).toContainText(FIXTURE_LEFT_RUN_ID);
    await expect(outcome).toContainText(FIXTURE_RIGHT_RUN_ID);
    await expect(outcome.getByText("Manifest comparison")).toBeVisible();
    await expect(outcome.getByText("Supplementary review / manifest diff")).toBeVisible();
    await expect(outcome.getByText("OK")).toHaveCount(2);
  });
});
