import { expect, type Locator, type Page } from "@playwright/test";

import { expectAnyLocatorVisible } from "./locator-readiness";

import {
  ASK_PAGE_PRIMARY_HEADING_PATTERN,
  AUDIT_PAGE_PRIMARY_HEADING_PATTERN,
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

/** Stable `/compare` page anchor — decoupled from buyer-polished vs full-operator title copy. */
export function comparePageReady(page: Page): Locator {
  return page.getByTestId("compare-page-ready");
}

/** Primary `/compare` H2 from {@link OperatorPageHeader} (`titleTestId="compare-page-heading"`). */
export function comparePageMainHeading(page: Page): Locator {
  return page.getByTestId("compare-page-heading");
}

/** Waits for `/compare` to finish Suspense hydration and render the interactive form shell. */
export async function waitForComparePageReady(page: Page, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout ?? 15_000;

  await expect(comparePageReady(page)).toBeVisible({ timeout });
  await expect(comparePageMainHeading(page)).toBeVisible({ timeout });
}

/**
 * Compare page subtitle under {@link OperatorPageHeader}.
 */
export function comparePageIntroGuidance(page: Page): Locator {
  return page.getByText(
    /Select two finalized review packages to see what changed in scope, findings, decisions, and evidence/i,
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

/** Primary `/governance/audit` H2 from {@link OperatorPageHeader} (excludes H3 "Filter audit trail"). */
export function auditPageMainHeading(page: Page): Locator {
  return page.getByRole("heading", { level: 2, name: AUDIT_PAGE_PRIMARY_HEADING_PATTERN });
}

/**
 * `/graph` readiness: interactive canvas, explicit load affordance, or buyer-polished trace-table default.
 * Buyer-polished demo builds default to the trace table before graph view — older specs only matched canvas / Load graph.
 */
export function graphPageReadySurfaceCandidates(page: Page): Locator[] {
  const main = page.getByRole("main");

  return [
    main.getByTestId("graph-canvas-ready"),
    main.getByTestId("evidence-trail-trace-table"),
    main.getByTestId("evidence-trail-trace-empty"),
    main.getByTestId("graph-viewer-chunk-loading"),
    main.getByRole("button", { name: /^Load graph$/i }),
    main.getByRole("button", { name: /^Load evidence trail$/i }),
  ];
}

/** @deprecated Prefer {@link expectGraphPageReadySurface}; retained for specs that compose locators manually. */
export function graphPageReadySurface(page: Page): Locator {
  const [first, ...rest] = graphPageReadySurfaceCandidates(page);

  return rest.reduce((combined, candidate) => combined.or(candidate.first()), first.first());
}

export async function expectGraphPageReadySurface(page: Page, options?: { timeout?: number }): Promise<void> {
  await expectAnyLocatorVisible(graphPageReadySurfaceCandidates(page), options?.timeout ?? 15_000);
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
  return page.getByRole("heading", { name: "Review comparison", level: 3 });
}

/**
 * Waits for URL auto-compare to finish. When results are still absent after the wait, expands collapsed pickers
 * and clicks **Compare** (mock routes, slow CI, or pages without auto-compare).
 */
export async function waitForCompareResultsReady(page: Page): Promise<void> {
  await waitForComparePageReady(page);

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
  await page.goto(`/signed-records/${encodeURIComponent(manifestId)}`);
}

/** Manifest page wired in the mock server for empty artifact list semantics. */
export async function gotoManifestEmptyArtifactsOperatorCase(page: Page): Promise<void> {
  await gotoManifestDetail(page, FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID);
}

// --- Assertions (only where duplicated across specs) ---

/** Buyer-polished run detail sticky section nav (`RunDetailSectionNav`). */
export function buyerPolishedReviewDetailSectionNav(page: Page): Locator {
  return page.getByRole("navigation", { name: "Review detail sections" });
}

/** Canonical buyer-polished section strip labels from `buildRunDetailNavSections`. */
export async function expectBuyerPolishedReviewDetailSectionNavCore(
  sectionNav: Locator,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeout = options?.timeoutMs ?? 15_000;

  await expect(sectionNav.getByRole("link", { name: "Decision" })).toBeVisible({ timeout });
  await expect(sectionNav.getByRole("link", { name: "Outcome record" })).toBeVisible({ timeout });
  await expect(sectionNav.getByRole("link", { name: "Evidence" })).toBeVisible({ timeout });
  await expect(sectionNav.getByRole("link", { name: "Assessment" })).toBeVisible({ timeout });
  await expect(sectionNav.getByRole("link", { name: "Activity" })).toBeVisible({ timeout });
  await expect(sectionNav.getByRole("link", { name: "Deliverables" })).toBeVisible({ timeout });
}

/** Main-content review outcome strip — `.first()` avoids strict-mode duplicates during hydration. */
export function reviewOutcomeSummaryStrip(page: Page): Locator {
  return page.getByRole("main").locator('section[aria-label="Review outcome summary"]').first();
}

/** Finalized package deep link on run detail (prefer over nested outcome-strip traversal). */
export function runDetailFinalizedPackageLink(page: Page): Locator {
  return page.getByRole("main").getByTestId("run-detail-finalized-package-link").first();
}

/** Featured package proof summary on buyer-polished home — visible instance only. */
export function runsDashboardBuyerProofSummary(page: Page): Locator {
  return page.getByRole("main").getByTestId("runs-dashboard-buyer-proof-summary").first();
}

/** Outcome strip deep link to signed record / legacy manifest detail (TB-399 canonical URLs). */
export function outcomeStripSignedRecordLink(outcomeStrip: Locator): Locator {
  return outcomeStrip
    .locator(
      '[data-testid="run-detail-finalized-package-link"], a[href^="/signed-records/"], a[href^="/manifests/"], a[href$="/signed-record"]',
    )
    .first();
}

/** Buyer-polished run detail collapses `#artifacts-exports` deliverables by default — expand before export assertions. */
export async function ensureBuyerDeliverablesSectionExpanded(page: Page): Promise<void> {
  const deliverablesDetails = page.locator("#artifacts-exports details").first();
  const deliverablesSummary = deliverablesDetails.locator("summary", { hasText: /^Deliverables$/ });

  await expect(deliverablesSummary).toBeVisible({ timeout: 60_000 });

  const detailsOpen: boolean = await deliverablesDetails.evaluate((element) => (element as HTMLDetailsElement).open);

  if (!detailsOpen) {
    await deliverablesSummary.click();
  }

  await expect(deliverablesDetails).toHaveAttribute("open", "");
}

/** Opens buyer-polished run deliverables and switches to the ARB/audit artifact tab. */
export async function openBuyerRunDetailArchitectureReviewBoardDeliverables(page: Page): Promise<Locator> {
  await ensureBuyerDeliverablesSectionExpanded(page);

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

/** Run detail page: loading finished and primary review headline (`RunDetailPageHeader` H1) is visible. */
export async function expectLiveRunDetailPageReady(page: Page, timeoutMs = 120_000): Promise<void> {
  await expect(page.getByText(/Loading review detail/i)).toHaveCount(0, { timeout: timeoutMs });
  await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: timeoutMs });
}
