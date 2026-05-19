import { expect, type Locator, type Page } from "@playwright/test";

import {
  FIXTURE_LEFT_RUN_ID,
  FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID,
  FIXTURE_RIGHT_RUN_ID,
  FIXTURE_RUN_ID,
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
 * Expands the fold when the left combobox is not yet visible.
 */
export async function expandCompareRunPickersIfCollapsed(page: Page): Promise<void> {
  const leftInput = comparePageLeftRunInput(page);

  if (await leftInput.isVisible()) {
    return;
  }

  const collapsedPickers = page.locator("details").filter({ has: leftInput });
  const summary = collapsedPickers.locator("summary");

  if ((await summary.count()) === 0) {
    return;
  }

  const isOpen: boolean = await collapsedPickers.evaluate((el) => (el as HTMLDetailsElement).open);

  if (!isOpen) {
    await summary.click();
  }

  await expect(leftInput).toBeVisible();
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

/**
 * Primary **Compare** control on `/compare`, scoped to the picker section so it never collides with the
 * contextual-help button (`aria-label` contains "compare-runs"), which plain `name: "Compare"` can match in Playwright.
 */
export function comparePageSubmitButton(page: Page) {
  return page.locator("section:has(#compare-select-heading)").getByRole("button", { name: "Compare", exact: true });
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

/** `<details aria-label="Comparison request outcome">` after a successful compare (not always role=region in browsers). */
export function comparisonRequestOutcomePanel(page: Page) {
  return page.locator('details[aria-label="Comparison request outcome"]');
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
