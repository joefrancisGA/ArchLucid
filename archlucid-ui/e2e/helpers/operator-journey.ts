import { expect, type Locator, type Page } from "@playwright/test";

import {
  ASK_PAGE_PRIMARY_HEADING_PATTERN,
  FIXTURE_LEFT_RUN_ID,
  FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID,
  FIXTURE_RIGHT_RUN_ID,
  FIXTURE_RUN_ID,
  GOVERNANCE_PAGE_PRIMARY_HEADING_PATTERN,
} from "../fixtures";

// --- Navigation (deterministic operator paths; defaults match shared fixtures) ---

/** Query string for `/compare` using the standard E2E run pair. */
export function comparePairSearchParams(
  leftRunId: string = FIXTURE_LEFT_RUN_ID,
  rightRunId: string = FIXTURE_RIGHT_RUN_ID,
): string {
  return new URLSearchParams({ leftRunId, rightRunId }).toString();
}

/** Opens compare with prefilled left/right (URL params). Does not register routes. */
export async function gotoComparePageWithFixturePair(
  page: Page,
  leftRunId: string = FIXTURE_LEFT_RUN_ID,
  rightRunId: string = FIXTURE_RIGHT_RUN_ID,
): Promise<void> {
  await page.goto(`/compare?${comparePairSearchParams(leftRunId, rightRunId)}`);
}

/**
 * Primary `/compare` H2 from {@link OperatorPageHeader}. Mock E2E sets demo env flags, so
 * `isBuyerPolishedOperatorShellEnv()` is true and the title is **Advanced review comparison**; full-operator
 * builds use **Compare reviews**.
 */
export function comparePageMainHeading(page: Page): Locator {
  return page.getByRole("heading", { level: 2, name: /Compare reviews|Advanced review comparison/i });
}

/**
 * Intro paragraph from {@link ComparePageIntro}. Mock E2E uses buyer-polished copy ("structured manifest diff
 * summary is the authoritative delta"); full-operator builds use "review the structured summary first".
 */
export function comparePageIntroGuidance(page: Page): Locator {
  return page.getByText(
    /review the structured summary first|structured manifest diff summary is the authoritative delta/i,
  );
}

/** Primary `/ask` H2 from {@link OperatorPageHeader} (buyer-polished vs full-operator titles). */
export function askPageMainHeading(page: Page): Locator {
  return page.getByRole("heading", { level: 2, name: ASK_PAGE_PRIMARY_HEADING_PATTERN });
}

/** Primary `/governance` H2 from {@link OperatorPageHeader} (buyer-polished vs full-operator titles). */
export function governancePageMainHeading(page: Page): Locator {
  return page.getByRole("heading", { level: 2, name: GOVERNANCE_PAGE_PRIMARY_HEADING_PATTERN });
}

/**
 * Optional narrative action on `/compare` — buyer-polished shell labels this **Summarize for leadership**;
 * full-operator shell uses **Summarize for sponsor**.
 */
export function comparePageSummarizeNarrativeButton(page: Page): Locator {
  return page.getByRole("button", { name: /Summarize for (sponsor|leadership)/i });
}

/** Stable combobox inputs on `/compare` (`inputId` on the left `RunIdPicker`). */
export function comparePageLeftRunInput(page: Page) {
  return page.locator("#compare-left-run-id");
}

/**
 * Buyer-polished Compare collapses pickers below results after a successful compare (`CompareRunPickersSection` `collapseBelowResults`).
 * Expands the fold when submit controls are not yet visible (URL auto-compare can collapse pickers after an earlier expand).
 */
export async function expandCompareRunPickersIfCollapsed(page: Page): Promise<void> {
  const submit = comparePageSubmitButton(page);

  if (await submit.isVisible()) {
    return;
  }

  const leftInput = comparePageLeftRunInput(page);
  const collapsedPickers = page.locator("details").filter({ has: leftInput });
  const summary = collapsedPickers.locator("summary");

  if ((await summary.count()) === 0) {
    return;
  }

  const isOpen: boolean = await collapsedPickers.evaluate((el) => (el as HTMLDetailsElement).open);

  if (!isOpen) {
    await summary.click();
  }

  await expect(submit).toBeVisible();
}

/**
 * Buyer-polished Compare: left run picker is readonly — change selection by opening the list and activating an option.
 * Requires a mocked non-empty `GET /v1/authority/projects/default/runs` (see {@link registerCompareStaleInputWarningRoutes}).
 */
export async function selectCompareLeftRunOptionByPrimaryLabel(page: Page, primaryLabel: string): Promise<void> {
  await expandCompareRunPickersIfCollapsed(page);
  const input = comparePageLeftRunInput(page);

  await input.click();
  const listPopup = page.locator("#compare-left-run-id-listbox");

  await expect(listPopup).toBeVisible();
  const option = listPopup.getByRole("option", { name: primaryLabel });

  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
}

/** Right-hand run combobox on `/compare`. */
export function comparePageRightRunInput(page: Page) {
  return page.locator("#compare-right-run-id");
}

/** Primary **Compare** control on `/compare` (`CompareRunPickersSection`). Label toggles to “Comparing…” while loading. */
export function comparePageSubmitButton(page: Page) {
  return page.getByTestId("compare-submit-button");
}

/** H3 shown once structured compare payload renders (`CompareResultsPanel`). */
export function compareManifestComparisonHeading(page: Page): Locator {
  return page.getByRole("heading", { name: "Manifest comparison", level: 3 });
}

/**
 * Waits for URL auto-compare to finish. When results are still absent after the wait, expands collapsed pickers
 * and clicks **Compare** (mock routes, slow CI, or pages without auto-compare).
 */
export async function waitForCompareResultsReady(page: Page): Promise<void> {
  const manifestHeading = compareManifestComparisonHeading(page);

  try {
    await expect(manifestHeading).toBeVisible({ timeout: 15_000 });

    return;
  } catch {
    // Fall through to manual compare.
  }

  await clickCompareSubmitWhenReady(page);
  await expect(manifestHeading).toBeVisible({ timeout: 15_000 });
}

/** Expands collapsed pickers when needed, then clicks **Compare** once the control is enabled. */
export async function clickCompareSubmitWhenReady(page: Page): Promise<void> {
  await expandCompareRunPickersIfCollapsed(page);
  const submit = comparePageSubmitButton(page);

  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await expandCompareRunPickersIfCollapsed(page);
  await submit.click();
}

/** Run detail for the standard mock-api run fixture (`e2e/mock-archlucid-api-server`). */
export async function gotoRunDetailForMockFixtureRun(page: Page): Promise<void> {
  // Canonical route is `/reviews/*` (`next.config.ts` redirects `/runs/*`). Go direct to avoid redirect flake on CI.
  await page.goto(`/reviews/${encodeURIComponent(FIXTURE_RUN_ID)}`);
}

/** Manifest detail for a known id (encode-safe). */
export async function gotoManifestDetail(page: Page, manifestId: string): Promise<void> {
  await page.goto(`/manifests/${encodeURIComponent(manifestId)}`);
}

/** Manifest page wired in the mock server for empty artifact list semantics. */
export async function gotoManifestEmptyArtifactsOperatorCase(page: Page): Promise<void> {
  await gotoManifestDetail(page, FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID);
}

// --- Assertions (only where duplicated across specs) ---

/** Opens buyer-polished run deliverables and switches to the ARB/audit artifact tab. */
export async function openBuyerRunDetailArchitectureReviewBoardDeliverables(page: Page): Promise<Locator> {
  const deliverablesDetails = page.locator("#artifacts-exports details").first();
  const deliverablesSummary = deliverablesDetails.locator("summary", { hasText: /^Deliverables$/ });

  await expect(deliverablesSummary).toBeVisible();

  const detailsOpen: boolean = await deliverablesDetails.evaluate((element) => (element as HTMLDetailsElement).open);

  if (!detailsOpen) {
    await deliverablesSummary.click();
  }

  const architectureReviewBoardTab = page.getByRole("tab", { name: "Architecture review board artifacts" });

  await expect(architectureReviewBoardTab).toBeVisible();
  await architectureReviewBoardTab.click();

  const deliverablesRegion = page.getByRole("region", { name: "Deliverables grouped by audience" });

  await expect(deliverablesRegion).toBeVisible();

  return deliverablesRegion;
}

/** `<details aria-label="Comparison request outcome">` after a successful compare (not always role=region in browsers). */
export function comparisonRequestOutcomePanel(page: Page) {
  return page.locator('details[aria-label="Comparison request outcome"]');
}

/**
 * `<summary>` on {@link CompareLastRequestOutcomeDetails}: buyer-polished mock E2E uses
 * **Comparison details (technical appendix)**; full-operator uses **Last compare request (technical)**.
 */
export const COMPARISON_REQUEST_OUTCOME_SUMMARY_PATTERN =
  /Last compare request \(technical\)|Comparison details \(technical appendix\)/;

export function comparisonRequestOutcomeSummary(page: Page): Locator {
  return comparisonRequestOutcomePanel(page).getByText(COMPARISON_REQUEST_OUTCOME_SUMMARY_PATTERN);
}

/** After Compare succeeds, the collapsed technical outcome strip is visible. */
export async function expectComparisonRequestOutcomeVisible(page: Page): Promise<void> {
  await expect(comparisonRequestOutcomePanel(page)).toBeVisible();
}

/**
 * Expands `<details aria-label="Comparison request outcome">` when closed.
 * Inner outcome rows (`Manifest comparison`, `OK`, etc.) are hidden until expanded unless
 * the compare page stale-inputs warning keeps the panel `open`.
 */
export async function expandComparisonRequestOutcome(page: Page): Promise<void> {
  const panel = comparisonRequestOutcomePanel(page);

  await expect(panel).toBeVisible();
  const isOpen: boolean = await panel.evaluate((el) => (el as HTMLDetailsElement).open);

  if (!isOpen) {
    await panel.locator(":scope > summary").click();
  }
}

/**
 * Opens supplementary legacy comparison (`<details id="compare-technical">`).
 * Content (`#compare-legacy`, review-level table) is hidden until expanded.
 */
export async function expandCompareTechnicalDetails(page: Page): Promise<void> {
  const technical = page.locator("#compare-technical");

  await expect(technical).toBeVisible();
  await technical.locator(":scope > summary").click();
}

/**
 * Opens the structured "Decision changes" fold under `#compare-structured`.
 * Buyer-polished / demo builds collapse these `<details>` by default (`buyerCompareUi`), so material rows stay hidden until expanded.
 */
export async function expandCompareStructuredDecisionChanges(page: Page): Promise<void> {
  const fold = page.locator("#compare-structured").locator("details").filter({ hasText: "Decision changes" }).first();

  await expect(fold).toBeVisible();
  const isOpen: boolean = await fold.evaluate((el) => (el as HTMLDetailsElement).open);

  if (!isOpen) {
    await fold.locator(":scope > summary").click();
  }
}

/**
 * Sponsor callout under structured manifest compare (`#compare-structured`).
 * Uses `data-testid` — buyer-polished shells rewrite fixture highlight prose (see
 * {@link applyBuyerPolishedGoldenManifestSummaryHighlights}), so asserting raw fixture copy flakes in mock CI.
 */
export function structuredCompareSponsorRecommendationParagraph(page: Page): Locator {
  return page.locator("#compare-structured").getByTestId("compare-sponsor-recommendation");
}
