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

/** Stable combobox inputs on `/compare` (`inputId` on the left `RunIdPicker`). */
export function comparePageLeftRunInput(page: Page) {
  return page.locator("#compare-left-run-id");
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
 * Sponsor callout under structured manifest compare (`#compare-structured`).
 * Do not assert highlight copy with bare `getByText` — the same string appears in summary highlights `<li>` (strict mode).
 */
export function structuredCompareSponsorRecommendationParagraph(page: Page): Locator {
  return page
    .locator("#compare-structured")
    .locator("p")
    .filter({ hasText: /Sponsor recommendation/i })
    .filter({ hasText: /Fixture highlight alpha/i });
}
