import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { FIXTURE_LEFT_RUN_ID, FIXTURE_RIGHT_RUN_ID } from "./fixtures";
import {
  comparePageIntroGuidance,
  comparePageLeftRunInput,
  comparePageMainHeading,
  comparePageRightRunInput,
  comparePageSummarizeNarrativeButton,
  clickCompareSubmitWhenReady,
  comparisonRequestOutcomePanel,
  comparisonRequestOutcomeSummary,
  expandComparisonRequestOutcome,
  expandCompareRunPickersIfCollapsed,
  expandCompareTechnicalDetails,
  expectComparisonRequestOutcomeVisible,
  gotoComparePageWithFixturePair,
  structuredCompareSponsorRecommendationParagraph,
  waitForCompareResultsReady,
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
    await expect(comparePageIntroGuidance(page)).toBeVisible();
    // URL pair triggers auto-compare; wait for results before expanding collapsed pickers or clicking submit.
    await waitForCompareResultsReady(page);
    await expect(page.getByTestId("compare-semantic-support-band-delta-panel")).toBeVisible();
    await expect(page.getByTestId("compare-classification-band-delta-panel")).toBeVisible();
    await expect(page.getByTestId("compare-treatment-band-delta-panel")).toBeVisible();
    await expect(page.getByTestId("compare-roi-headline-delta-panel")).toBeVisible();
    await expect(page.getByTestId("compare-gate-outcome-delta-panel")).toBeVisible();
    await expect(page.getByTestId("compare-pack-assignment-delta-panel")).toBeVisible();
    await expect(page.getByTestId("compare-execution-mode-delta-panel")).toBeVisible();
    await expandCompareRunPickersIfCollapsed(page);
    await expect(comparePageSummarizeNarrativeButton(page)).toBeVisible();

    await clickCompareSubmitWhenReady(page);
    await expectComparisonRequestOutcomeVisible(page);
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
      await expect(reviewNav.getByRole("link", { name: "Review comparison summary" })).toBeVisible();
      await expect(reviewNav.getByRole("link", { name: "Review change details appendix" })).toBeVisible();
      await expect(reviewNav.getByRole("link", { name: "Technical details (supplementary diff)" })).toBeVisible();
    } else {
      await expect(page.getByTestId("compare-raw-manifest-diff")).toBeVisible();
    }

    await expandComparisonRequestOutcome(page);

    const outcome = comparisonRequestOutcomePanel(page);
    await expect(comparisonRequestOutcomeSummary(page)).toBeVisible();
    await expect(outcome).toContainText(FIXTURE_LEFT_RUN_ID);
    await expect(outcome).toContainText(FIXTURE_RIGHT_RUN_ID);
    await expect(outcome.getByText("Review comparison")).toBeVisible();
    await expect(outcome.getByText("Supplementary review / review diff")).toBeVisible();
    await expect(outcome.getByText("OK")).toHaveCount(2);
  });

  test("end-to-end compare export download includes Compare Verdict Chrome Delta markdown", async ({ page }) => {
    await registerDefaultPairLegacyStructuredCompare(page);
    await page.route("**/api/proxy/v1/architecture/review/compare/end-to-end/export**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/markdown; charset=utf-8",
        headers: {
          "Content-Disposition": 'attachment; filename="end_to_end_compare.md"',
        },
        body: "## Compare Verdict Chrome Delta\n\n- Gate outcome changed: No → Soft infeasible\n",
      });
    });

    await gotoComparePageWithFixturePair(page);
    await waitForCompareResultsReady(page);

    const exportButton = page.getByTestId("compare-download-end-to-end-compare-export-button");
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;
    const savePath = path.join(os.tmpdir(), `compare-end-to-end-export-${Date.now()}.md`);

    await download.saveAs(savePath);
    const markdown = await fs.readFile(savePath, "utf8");

    expect(markdown).toContain("## Compare Verdict Chrome Delta");
  });
});
