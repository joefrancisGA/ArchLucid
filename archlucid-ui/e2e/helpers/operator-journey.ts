import { expect, type Locator, type Page, type Response } from "@playwright/test";

import {
  buildReviewDetailTabHref,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

import { expectAnyLocatorVisible } from "./locator-readiness";
import { getAppMain } from "./app-main";
import { waitForLiveManifestDetailHydration } from "./live-page-readiness";
import { normalizeRunIdForCompare, toRunGuidPathSegment } from "./live-api-client";

import {
  ASK_PAGE_PRIMARY_HEADING_PATTERN,
  AUDIT_PAGE_PRIMARY_HEADING_PATTERN,
  FIXTURE_LEFT_RUN_ID,
  FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID,
  FIXTURE_RIGHT_RUN_ID,
  FIXTURE_RUN_ID,
  GOVERNANCE_PAGE_PRIMARY_HEADING_PATTERN,
  MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN,
} from "../fixtures";

// --- Navigation (deterministic operator paths; defaults match shared fixtures) ---

/** Query string for `/insights/compare-two-reviews` using the standard E2E run pair. */
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
  await page.goto(`/insights/compare-two-reviews?${comparePairSearchParams(leftRunId, rightRunId)}`);
}

/** Stable `/insights/compare-two-reviews` page anchor — decoupled from buyer-polished vs full-operator title copy. */
export function comparePageReady(page: Page): Locator {
  return page.getByTestId("compare-page-ready");
}

/** Primary `/insights/compare-two-reviews` H2 from {@link OperatorPageHeader} (`titleTestId="compare-page-heading"`). */
export function comparePageMainHeading(page: Page): Locator {
  return page.getByTestId("compare-page-heading");
}

/** Waits for `/insights/compare-two-reviews` to finish Suspense hydration and render the interactive form shell. */
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
    /Select two finalized reviews to see what changed in scope, findings, decisions, and evidence/i,
  );
}

/** Assert operator `main` has no hard failure chrome (generic error banners, failed request alerts). */
export async function expectMainHasNoHardFailureChrome(page: Page): Promise<void> {
  const main = page.getByRole("main").first();

  await expect(main.getByText(/Something went wrong/i)).toHaveCount(0);
  await expect(main.getByRole("alert").filter({ hasText: /request failed/i })).toHaveCount(0);
  await expect(main.getByText(/Aggregate explanation could not be loaded/i)).toHaveCount(0);
}

/** Primary `/insights/ask-review-questions` H2 from {@link OperatorPageHeader} (buyer-polished vs full-operator titles). */
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

/** `/governance/approval-queue?runId=` review context — query picker is hidden; approvals load via URL param. */
export async function expectGovernanceRunWorkflowVisible(
  page: Page,
  approvalRequestId: string,
  statusLabel: string,
): Promise<void> {
  const section = page.getByTestId("governance-approval-requests-section");

  await expect(section).toBeVisible({ timeout: 60_000 });

  const requestRow = section.locator('[data-testid="governance-approval-request-row"]').filter({
    hasText: approvalRequestId,
  }).first();

  await expect(requestRow).toBeVisible({ timeout: 60_000 });
  await expect(requestRow.getByText(new RegExp(`^${statusLabel}$`, "i"))).toBeVisible({ timeout: 60_000 });
}

/** Expands buyer-polished audit optional filters (`audit-filters-collapsible-trigger`). */
export async function expandAuditBuyerFiltersIfPresent(page: Page): Promise<void> {
  const trigger = page.getByTestId("audit-filters-collapsible-trigger");

  if ((await trigger.count()) === 0) {
    return;
  }

  await trigger.scrollIntoViewIfNeeded();

  await expect(async () => {
    const expanded = await trigger.getAttribute("aria-expanded");

    if (expanded === "true") {
      return;
    }

    await trigger.click({ force: true });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  }).toPass({ timeout: 15_000 });
}

/** Asserts audit search completed with an empty result set (summary + empty-state line). */
export async function expectAuditSearchNoResults(page: Page, options?: { timeoutMs?: number }): Promise<void> {
  const timeout = options?.timeoutMs ?? 60_000;

  await expect(page.getByTestId("audit-search-summary")).toContainText(
    /Showing 0 events|No audit events in this view/i,
    { timeout },
  );
  await expect(
    page.getByTestId("audit-search-no-results").or(page.getByTestId("audit-buyer-empty-state")),
  ).toBeVisible({ timeout });
}

function matchesAuditSearchGet(response: Response, runId?: string): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  if (!response.url().includes("/v1/audit/search")) {
    return false;
  }

  if (runId !== undefined && runId.length > 0 && !response.url().includes(`runId=${encodeURIComponent(runId)}`)) {
    return false;
  }

  return true;
}

async function delayAfterPlaywrightRateLimit(response: Response): Promise<void> {
  const headers = response.headers();
  const retryAfterRaw = headers["retry-after"] ?? headers["Retry-After"];
  const seconds = retryAfterRaw ? Number.parseInt(String(retryAfterRaw).trim(), 10) : Number.NaN;
  const ms = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 60_000) : 2500;

  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clicks audit Search and waits for a successful `/v1/audit/search` response.
 * Retries on HTTP 429 when many live specs share one API process (matches `searchAudit` in live-api-client).
 */
export async function clickAuditSearchAndWaitForSuccessfulResponse(
  page: Page,
  options?: { runId?: string; timeoutMs?: number; maxAttempts?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const maxAttempts = options?.maxAttempts ?? 8;
  const runId = options?.runId;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const responsePromise = page.waitForResponse((response) => matchesAuditSearchGet(response, runId), {
      timeout: timeoutMs,
    });

    await page.getByTestId("audit-search-button").click();

    const response = await responsePromise;

    if (response.ok()) {
      return;
    }

    if (response.status() === 429 && attempt < maxAttempts - 1) {
      await delayAfterPlaywrightRateLimit(response);

      continue;
    }

    expect(
      response.ok(),
      `audit search expected 2xx, got ${response.status()} after ${attempt + 1} attempt(s)`,
    ).toBe(true);
  }
}

/**
 * `/insights/evidence-graph` readiness: interactive canvas, explicit load affordance, or buyer-polished trace-table default.
 * Buyer-polished demo builds default to the trace table before graph view — older specs only matched canvas / Load graph.
 */
export function graphPageReadySurfaceCandidates(page: Page): Locator[] {
  const main = page.getByRole("main");

  return [
    main.getByTestId("graph-canvas-ready"),
    main.getByTestId("evidence-trail-trace-table"),
    main.getByTestId("evidence-trail-trace-empty"),
    main.getByTestId("graph-viewer-chunk-loading"),
    main.getByTestId("graph-idle-placeholder-primary"),
    main.getByTestId("graph-idle-placeholder"),
    main.getByTestId("graph-page-controls-buyer"),
    main.getByTestId("graph-presentation-tabs"),
    main.getByTestId("graph-review-picker-status"),
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
 * Optional narrative action on `/insights/compare-two-reviews` — buyer-polished shell labels this **Summarize for leadership**;
 * full-operator shell uses **Summarize for sponsor**.
 */
export function comparePageSummarizeNarrativeButton(page: Page): Locator {
  return page.getByRole("button", { name: /Summarize for (sponsor|leadership)/i });
}

/** Stable combobox inputs on `/insights/compare-two-reviews` (`inputId` on the left `RunIdPicker`). */
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
  // Outer "Change compared reviews" fold only — nested Advanced details also has a summary.
  const collapsedPickers = page.locator("details").filter({ has: leftInput }).first();
  const summary = collapsedPickers.locator(":scope > summary");

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
 * Requires a mocked non-empty `GET /v1/authority/projects/default/reviews` (see {@link registerCompareStaleInputWarningRoutes}).
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

/** Right-hand run combobox on `/insights/compare-two-reviews`. */
export function comparePageRightRunInput(page: Page) {
  return page.locator("#compare-right-run-id");
}

/** Primary **Compare** control on `/insights/compare-two-reviews` (`CompareRunPickersSection`). Label toggles to “Comparing…” while loading. */
export function comparePageSubmitButton(page: Page) {
  return page.getByTestId("compare-submit-button");
}

/** H2 shown once structured compare payload renders (`StructuredComparisonView`). */
export function compareManifestComparisonHeading(page: Page): Locator {
  return page.getByRole("heading", { name: "Review comparison", level: 2 });
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
  // Canonical route is `/architecture/reviews/*` — go direct; legacy `/runs/*` bookmarks 404.
  await page.goto(`/architecture/reviews/${encodeURIComponent(FIXTURE_RUN_ID)}`);
}

/** Manifest detail for a known id (encode-safe). Prefer canonical governance path (legacy `/signed-records/*` redirects). */
export async function gotoManifestDetail(page: Page, manifestId: string): Promise<void> {
  await page.goto(`/governance/signed-records/${encodeURIComponent(manifestId)}`);
}

/** Manifest page wired in the mock server for empty artifact list semantics. */
export async function gotoManifestEmptyArtifactsOperatorCase(page: Page): Promise<void> {
  await gotoManifestDetail(page, FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID);
}

// --- Assertions (only where duplicated across specs) ---

/** Tabbed buyer-polished run detail workspace (`ReviewDetailWorkspace`). */
export function buyerPolishedReviewDetailWorkspace(page: Page): Locator {
  return page.getByTestId("review-detail-workspace");
}

/** Buyer-polished run detail sticky section nav (`RunDetailSectionNav`). */
export function buyerPolishedReviewDetailSectionNav(page: Page): Locator {
  return page.getByRole("navigation", { name: "Review detail sections" });
}

/** Anchor ids from `buildRunDetailNavSections` buyer-polished strip (stable vs substring role names). */
export function buyerPolishedReviewDetailSectionNavLink(sectionNav: Locator, sectionId: string): Locator {
  return sectionNav.locator(`a[href="#${sectionId}"]`);
}

const BUYER_POLISHED_REVIEW_DETAIL_CORE_SECTION_IDS = [
  "run-decision-summary",
  "manifest-summary",
  "trust-evidence",
  "run-explanation",
  "pipeline-timeline",
  "artifacts-exports",
] as const;

const BUYER_POLISHED_REVIEW_DETAIL_CORE_WORKSPACE_TABS: readonly ReviewDetailTabId[] = [
  "overview",
  "findings",
  "evidence",
  "policies",
  "activity",
];

/** Run detail loaded — tabbed workspace (current) or legacy sticky section nav. */
export async function expectBuyerPolishedReviewDetailShellReady(
  page: Page,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;

  await expectLiveRunDetailPageReady(page, timeoutMs);
  await expect(page.getByText(/Review could not be loaded/i)).toHaveCount(0, { timeout: timeoutMs });

  const workspace = buyerPolishedReviewDetailWorkspace(page);
  const sectionNav = buyerPolishedReviewDetailSectionNav(page);

  await expect(async () => {
    const hasWorkspace = (await workspace.count()) > 0;
    const hasSectionNav = (await sectionNav.count()) > 0;

    expect(hasWorkspace || hasSectionNav).toBe(true);
  }).toPass({ timeout: timeoutMs });

  if ((await workspace.count()) > 0) {
    await expect(workspace).toBeVisible({ timeout: timeoutMs });
    await expect(page.getByTestId("review-detail-workspace-tabs")).toBeVisible({ timeout: timeoutMs });

    return;
  }

  await expect(sectionNav).toBeVisible({ timeout: timeoutMs });
}

/** Canonical buyer-polished workspace tabs on committed review detail. */
export async function expectBuyerPolishedReviewDetailWorkspaceCore(
  page: Page,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeout = options?.timeoutMs ?? 15_000;

  await expect(buyerPolishedReviewDetailWorkspace(page)).toBeVisible({ timeout });

  for (const tab of BUYER_POLISHED_REVIEW_DETAIL_CORE_WORKSPACE_TABS) {
    const tabLocator = page.getByTestId(`review-detail-workspace-tab-${tab}`);

    await expect(async () => {
      if (!(await tabLocator.isVisible())) {
        const moreTabs = page.getByTestId("review-detail-workspace-more-tabs");

        if ((await moreTabs.count()) > 0) {
          await moreTabs.first().evaluate((element) => {
            if (element instanceof HTMLDetailsElement) {
              element.open = true;
            }
          });
        }
      }

      await expect(tabLocator).toBeVisible();
    }).toPass({ timeout });
  }
}

/** Canonical buyer-polished section strip labels from `buildRunDetailNavSections`. */
export async function expectBuyerPolishedReviewDetailSectionNavCore(
  sectionNav: Locator,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeout = options?.timeoutMs ?? 15_000;

  for (const sectionId of BUYER_POLISHED_REVIEW_DETAIL_CORE_SECTION_IDS) {
    await expect(buyerPolishedReviewDetailSectionNavLink(sectionNav, sectionId)).toBeVisible({ timeout });
  }
}

/** Severity metadata labels on quick-decision finding rows (`SeverityTag`). */
export function quickDecisionSeverityBadge(quickSummary: Locator): Locator {
  return quickSummary.getByLabel(/^Severity: (Critical|High|Medium)$/i);
}

export async function expectQuickDecisionSeverityVisible(
  quickSummary: Locator,
  options?: { timeoutMs?: number },
): Promise<void> {
  await expect(quickDecisionSeverityBadge(quickSummary).first()).toBeVisible({
    timeout: options?.timeoutMs ?? 30_000,
  });
}

/** Main-content review outcome strip — `.first()` avoids strict-mode duplicates during hydration. */
export function reviewOutcomeSummaryStrip(page: Page): Locator {
  return getAppMain(page).locator('section[aria-label="Review outcome summary"]').first();
}

function reviewDetailWorkspacePanel(page: Page, tab: ReviewDetailTabId): Locator {
  return page.getByTestId(`review-detail-workspace-panel-${tab}`);
}

/** "More sections" collapses advanced workspace tabs — expand before clicking hidden triggers. */
async function ensureReviewDetailWorkspaceTabTriggerVisible(
  page: Page,
  tab: ReviewDetailTabId,
  options?: { timeoutMs?: number },
): Promise<Locator> {
  const timeout = options?.timeoutMs ?? 15_000;
  const trigger = page.getByTestId(`review-detail-workspace-tab-${tab}`);

  await expect(async () => {
    if (!(await trigger.isVisible())) {
      const moreTabs = page.getByTestId("review-detail-workspace-more-tabs");

      if ((await moreTabs.count()) > 0) {
        await moreTabs.first().evaluate((element) => {
          if (element instanceof HTMLDetailsElement) {
            element.open = true;
          }
        });
      }
    }

    await expect(trigger).toBeVisible();
  }).toPass({ timeout });

  return trigger;
}

/** Radix tab panels hide inactive workspace content — open the tab before tab-scoped assertions. */
export async function openReviewDetailWorkspaceTab(
  page: Page,
  runId: string,
  tab: ReviewDetailTabId,
): Promise<void> {
  const href = buildReviewDetailTabHref(runId, tab);
  const url = new URL(page.url());
  const trimmedRunId = runId.trim();
  const encodedRunId = encodeURIComponent(trimmedRunId);
  const encodedGuidRunId = encodeURIComponent(toRunGuidPathSegment(trimmedRunId));
  const onRunDetail =
    url.pathname === `/architecture/reviews/${encodedRunId}`
    || url.pathname === `/architecture/reviews/${encodedGuidRunId}`
    || url.pathname.toLowerCase() === `/architecture/reviews/${encodedRunId}`.toLowerCase()
    || url.pathname.toLowerCase() === `/architecture/reviews/${encodedGuidRunId}`.toLowerCase();

  const trigger = page.getByTestId(`review-detail-workspace-tab-${tab}`);

  // Prefer in-place tab activation — full page.goto drops cold-start scope races on demo/tenant shells.
  if (onRunDetail && (await trigger.count()) > 0) {
    const visibleTrigger = await ensureReviewDetailWorkspaceTabTriggerVisible(page, tab);
    const dataState = await visibleTrigger.getAttribute("data-state");
    const ariaCurrent = await visibleTrigger.getAttribute("aria-current");
    const alreadyActive = dataState === "active" || ariaCurrent === "page";

    if (!alreadyActive) {
      await visibleTrigger.click();
    }
  } else {
    await page.goto(href);
  }

  await expect(reviewDetailWorkspacePanel(page, tab)).toBeVisible({ timeout: 60_000 });
  // Primary tabs use TabsTrigger `data-state`; "More sections" buttons use `aria-current="page"`.
  const activeTab = page.getByTestId(`review-detail-workspace-tab-${tab}`);

  await expect
    .poll(async () => {
      const dataState = await activeTab.getAttribute("data-state");
      const ariaCurrent = await activeTab.getAttribute("aria-current");

      return dataState === "active" || ariaCurrent === "page";
    }, { timeout: 15_000 })
    .toBe(true);
}

function reviewDetailOutcomeCardsDetails(page: Page): Locator {
  // Primary buyer layout folds outcome cards under Overview; architecture-created layouts keep them on Activity.
  return getAppMain(page)
    .locator("details")
    .filter({ has: page.getByText("Detailed outcome cards", { exact: true }) })
    .first();
}

/** Overview/Activity folds outcome cards by default — expand before asserting the outcome summary strip. */
export async function expandReviewDetailOutcomeCards(page: Page): Promise<void> {
  const details = reviewDetailOutcomeCardsDetails(page);

  await expect(details).toBeVisible({ timeout: 60_000 });

  const isOpen: boolean = await details.evaluate((element) => (element as HTMLDetailsElement).open);

  if (!isOpen) {
    await details.locator(":scope > summary").click();
  }

  await expect(details).toHaveAttribute("open");
}

/** Findings tab workspace cards fold row actions by default — expand before chip/link assertions. */
export async function expandFindingWorkspaceCard(scope: Locator, findingId: string): Promise<Locator> {
  const card = scope.getByTestId(`finding-workspace-card-${findingId}`);

  await expect(card).toBeVisible({ timeout: 60_000 });

  // Primary cards nest supporting-detail + integrations disclosures; secondary cards wrap the row in details.
  const details = card.locator("details").first();
  const detailsCount = await card.locator("details").count();

  if (detailsCount > 0) {
    const isOpen: boolean = await details.evaluate((element) => (element as HTMLDetailsElement).open);

    if (!isOpen) {
      await details.locator(":scope > summary").click();
    }

    await expect(details).toHaveAttribute("open");
  }

  return card;
}

/** Opens overview (buyer layout) or activity, expands outcome cards, and returns the outcome summary strip. */
export async function openVisibleReviewOutcomeSummaryStrip(page: Page, runId: string): Promise<Locator> {
  await openReviewDetailWorkspaceTab(page, runId, "overview");

  const outcomeStrip = reviewOutcomeSummaryStrip(page);
  const manifestLink = runDetailFinalizedPackageLink(page);

  await expect(async () => {
    if (await outcomeStrip.isVisible()) {
      return;
    }

    // Architecture-created layouts keep the disclosure on Activity — retry there if Overview has no fold.
    if ((await reviewDetailOutcomeCardsDetails(page).count()) === 0) {
      await openReviewDetailWorkspaceTab(page, runId, "activity");
    }

    await expandReviewDetailOutcomeCards(page);

    if (await outcomeStrip.isVisible()) {
      return;
    }

    await expect(manifestLink).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 60_000 });

  await expect(outcomeStrip).toBeVisible({ timeout: 5_000 });

  return outcomeStrip;
}

/** Finalized package deep link on run detail (prefer over nested outcome-strip traversal). */
export function runDetailFinalizedPackageLink(page: Page): Locator {
  return getAppMain(page).getByTestId("run-detail-finalized-package-link").first();
}

/** Poll until the finalized manifest deep link is visible (overview/activity + folded outcome cards). */
export async function expectFinalizedManifestLinkVisible(
  page: Page,
  options?: { runId?: string; timeoutMs?: number },
): Promise<Locator> {
  const timeoutMs = options?.timeoutMs ?? 120_000;
  const manifestLink = runDetailFinalizedPackageLink(page);

  await expect(async () => {
    if (options?.runId !== undefined && options.runId.trim().length > 0) {
      // Buyer layout folds outcome cards under Overview; architecture-created keeps them on Activity.
      await openReviewDetailWorkspaceTab(page, options.runId, "overview");

      if ((await reviewDetailOutcomeCardsDetails(page).count()) === 0) {
        await openReviewDetailWorkspaceTab(page, options.runId, "activity");
      }
    } else if ((await buyerPolishedReviewDetailWorkspace(page).count()) > 0) {
      await page.getByTestId("review-detail-workspace-tab-overview").click();
      await expect(reviewDetailWorkspacePanel(page, "overview")).toBeVisible({ timeout: 60_000 });

      if ((await reviewDetailOutcomeCardsDetails(page).count()) === 0) {
        await page.getByTestId("review-detail-workspace-tab-activity").click();
        await expect(reviewDetailWorkspacePanel(page, "activity")).toBeVisible({ timeout: 60_000 });
      }
    }

    if (await manifestLink.isVisible()) {
      return;
    }

    await expandReviewDetailOutcomeCards(page);
    await expect(manifestLink).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: timeoutMs });

  return manifestLink;
}

/** Featured package proof summary on buyer-polished home — visible instance only. */
export function runsDashboardBuyerProofSummary(page: Page): Locator {
  return page.getByRole("main").getByTestId("runs-dashboard-buyer-proof-summary").first();
}

/** Outcome strip deep link to signed record / legacy manifest detail (TB-399 canonical URLs). */
export function outcomeStripSignedRecordLink(outcomeStrip: Locator): Locator {
  return outcomeStrip
    .locator(
      '[data-testid="run-detail-finalized-package-link"], a[href*="/signed-records/"], a[href^="/manifests/"], a[href$="/signed-record"]',
    )
    .first();
}

/**
 * Buyer-polished pipeline timeline uses `<summary>` inside {@link CollapsibleSection}, not an `<h3>` heading.
 * Scroll via section nav, then assert the collapsible affordance is present (collapsed by default).
 */
export async function expectBuyerPipelineTimelineSectionVisible(
  page: Page,
  options?: { timeoutMs?: number; runId?: string },
): Promise<void> {
  const timeout = options?.timeoutMs ?? 60_000;
  const trimmedRunId = options?.runId?.trim() ?? "";

  await expect(async () => {
    if (trimmedRunId.length > 0) {
      await page.goto(buildReviewDetailTabHref(trimmedRunId, "activity", { hash: "pipeline-timeline" }), {
        waitUntil: "domcontentloaded",
      });
      await expect(reviewDetailWorkspacePanel(page, "activity")).toBeVisible({ timeout: 30_000 });
    } else {
      const activityTrigger = await ensureReviewDetailWorkspaceTabTriggerVisible(page, "activity", {
        timeoutMs: 30_000,
      });

      await activityTrigger.click();
      await expect(reviewDetailWorkspacePanel(page, "activity")).toBeVisible({ timeout: 30_000 });
    }

    const belowFoldLoading = page.getByRole("status", {
      name: /Loading review technical sections|Loading pipeline timeline/i,
    });

    const loadingCount = await belowFoldLoading.count();

    if (loadingCount > 0) {
      const anyVisible = await belowFoldLoading
        .first()
        .isVisible()
        .catch(() => false);

      if (anyVisible) {
        throw new Error("below-fold pipeline sections still loading");
      }
    }

    const sectionNav = page.getByTestId("provenance-section-nav-desktop");

    if ((await sectionNav.count()) > 0) {
      const pipelineNavLink = sectionNav.getByRole("link", { name: /Recent lifecycle events/i });

      if ((await pipelineNavLink.count()) > 0) {
        await pipelineNavLink.first().click();
      }
    }

    const pipelineSection = page.locator("#pipeline-timeline").first();
    const collapsible = page.getByTestId("run-pipeline-timeline-collapsible").first();
    const pipelineSurface = collapsible.or(pipelineSection).first();

    await expect(pipelineSurface).toBeVisible({ timeout: 10_000 });
    await pipelineSurface.scrollIntoViewIfNeeded();

    if ((await collapsible.count()) > 0 && (await collapsible.isVisible())) {
      await expect(
        collapsible.locator("summary", { hasText: /Recent lifecycle events|Pipeline timeline/i }),
      ).toBeVisible({ timeout: 10_000 });

      return;
    }

    const heading = pipelineSection.getByRole("heading", {
      name: /Recent lifecycle events|Pipeline timeline/i,
    });

    await expect(heading.first()).toBeVisible({ timeout: 10_000 });
  }).toPass({ timeout });
}

/** Buyer-polished run detail collapses `#artifacts-exports` deliverables by default — expand before export assertions. */
export async function ensureBuyerDeliverablesSectionExpanded(page: Page, runId?: string): Promise<void> {
  // `#artifacts-exports` lives on the Evidence workspace tab (see LEGACY_HASH_TO_TAB), not Activity.
  const artifactsSection = page.locator("#artifacts-exports");
  const sectionNav = buyerPolishedReviewDetailSectionNav(page);

  if ((await sectionNav.count()) > 0) {
    await buyerPolishedReviewDetailSectionNavLink(sectionNav, "artifacts-exports").click();
  } else if ((await artifactsSection.count()) === 0 || !(await artifactsSection.isVisible())) {
    if (runId !== undefined && runId.trim().length > 0) {
      await openReviewDetailWorkspaceTab(page, runId, "evidence");
    } else if ((await buyerPolishedReviewDetailWorkspace(page).count()) > 0) {
      await page.getByTestId("review-detail-workspace-tab-evidence").click();
      await expect(reviewDetailWorkspacePanel(page, "evidence")).toBeVisible({ timeout: 60_000 });
    }
  }

  // Wait for the section (and golden-manifest gate) before scroll — scrollIntoViewIfNeeded alone
  // absorbs the full test timeout when the wrong tab left the node unmounted.
  await expect(artifactsSection).toBeVisible({ timeout: 90_000 });
  await artifactsSection.scrollIntoViewIfNeeded();

  const deliverablesDetails = artifactsSection.locator("details").first();
  const deliverablesSummary = deliverablesDetails.locator("summary", { hasText: /^Deliverables$/ });

  await expect(deliverablesSummary).toBeVisible({ timeout: 60_000 });

  const detailsOpen: boolean = await deliverablesDetails.evaluate((element) => (element as HTMLDetailsElement).open);

  if (!detailsOpen) {
    await deliverablesSummary.click();
  }

  await expect(deliverablesDetails).toHaveAttribute("open", "");
}

/** Buyer-polished run detail collapses `#sponsor-handoff` (Time-to-Value banner) by default — expand before sponsor PDF assertions. */
export async function ensureBuyerSponsorBriefingSectionExpanded(page: Page, runId?: string): Promise<void> {
  // `#sponsor-handoff` maps to the Review package workspace tab (see LEGACY_HASH_TO_TAB /
  // run-detail-section-tab-map). The above-the-fold strip also mounts outside tabs when the primary
  // action is send-to-sponsor — still open Review package first so extended briefing anchors resolve.
  const sponsorHandoff = page.locator("#sponsor-handoff").first();

  await expect(async () => {
    if (runId !== undefined && runId.trim().length > 0) {
      await openReviewDetailWorkspaceTab(page, runId, "review-package");
    } else if ((await buyerPolishedReviewDetailWorkspace(page).count()) > 0) {
      await page.getByTestId("review-detail-workspace-tab-review-package").click();
      await expect(reviewDetailWorkspacePanel(page, "review-package")).toBeVisible({ timeout: 30_000 });
    } else {
      const sectionNav = buyerPolishedReviewDetailSectionNav(page);
      const sponsorNavLink = buyerPolishedReviewDetailSectionNavLink(sectionNav, "sponsor-handoff");

      if ((await sponsorNavLink.count()) > 0) {
        await sponsorNavLink.click();
      }
    }

    if ((await sponsorHandoff.count()) === 0) {
      await page.reload({ waitUntil: "domcontentloaded" });
      throw new Error("sponsor-handoff not mounted on Review package tab yet");
    }

    const briefingDetails = page.locator("details:has(#sponsor-handoff)").first();

    if ((await briefingDetails.count()) > 0) {
      const briefingSummary = briefingDetails.locator("summary").first();
      const detailsOpen: boolean = await briefingDetails.evaluate(
        (element) => (element as HTMLDetailsElement).open,
      );

      if (!detailsOpen) {
        await briefingSummary.click();
      }

      await expect(briefingDetails).toHaveAttribute("open", "");
    }

    await expect(sponsorHandoff).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 120_000 });

  await sponsorHandoff.scrollIntoViewIfNeeded();
}

/** Opens buyer-polished run deliverables and switches to the ARB/audit artifact tab. */
export async function openBuyerRunDetailArchitectureReviewBoardDeliverables(page: Page): Promise<Locator> {
  await ensureBuyerDeliverablesSectionExpanded(page);

  const architectureReviewBoardTab = page.getByRole("tab", { name: "Architecture review board artifacts" });

  await expect(architectureReviewBoardTab).toBeVisible();
  await architectureReviewBoardTab.click();

  const arbPanel = page.getByTestId("buyer-deliverables-panel-arb");

  await expect(arbPanel).toBeVisible({ timeout: 15_000 });

  const deliverablesRegion = arbPanel.getByRole("region", { name: "Deliverables grouped by audience" });
  const emptyCopy = arbPanel.getByText(
    /No architecture review board or audit-scoped outputs are listed for this review/i,
  );

  await expect(deliverablesRegion.or(emptyCopy).first()).toBeVisible({ timeout: 15_000 });

  return deliverablesRegion.or(emptyCopy).first();
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
 * Top change highlight on the comparison verdict summary (sibling above `#compare-structured`).
 * Uses `data-testid` — buyer-polished shells rewrite fixture highlight prose (see
 * {@link applyBuyerPolishedGoldenManifestSummaryHighlights}), so asserting raw fixture copy flakes in mock CI.
 * Formerly `compare-sponsor-recommendation` (RC28); renamed with CompareVerdictSummary verdict lead.
 */
export function structuredCompareSponsorRecommendationParagraph(page: Page): Locator {
  return page.getByTestId("compare-top-change-highlight");
}

/** Navigates to `/architecture/reviews/{runId}` with encoded id and DOM-ready wait (live API E2E parity). */
export async function gotoLiveRunDetailPage(
  page: Page,
  runId: string,
  options?: { waitUntil?: "commit" | "domcontentloaded" | "load" },
): Promise<void> {
  await page.goto(`/architecture/reviews/${encodeURIComponent(runId)}`, {
    waitUntil: options?.waitUntil ?? "domcontentloaded",
  });
}

/** Run detail page: loading finished and primary review headline (`RunDetailPageHeader` H1) is visible. */
export async function expectLiveRunDetailPageReady(page: Page, timeoutMs = 120_000): Promise<void> {
  const loadingReviewDetail = page.getByLabel("Loading review detail");
  const reviewDetailRoot = page.getByTestId("review-detail-root");
  const mainHeading = page.locator("main h1").first();
  const loadFailure = page.getByTestId("run-detail-load-failure");
  const brandedNotFound = page.getByTestId("branded-not-found");
  const brandedTransientFailure = page.getByTestId("branded-transient-failure");

  await expect(async () => {
    await expect(loadingReviewDetail).toHaveCount(0, { timeout: 5_000 });
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);

    // Fail this toPass iteration immediately on hard/transient failure chrome so callers can reload
    // instead of polling a dead SSR error page until timeoutMs (demo-workspace cold starts).
    if ((await loadFailure.count()) > 0) {
      throw new Error("Review detail load-failure surface is visible (run-detail-load-failure).");
    }

    if ((await brandedNotFound.count()) > 0) {
      throw new Error("Review detail branded-not-found surface is visible.");
    }

    if ((await brandedTransientFailure.count()) > 0) {
      throw new Error("Review detail branded-transient-failure surface is visible.");
    }

    await expect(reviewDetailRoot).toBeVisible({ timeout: 5_000 });
    await expect(mainHeading).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: timeoutMs });
}

/** Live manifest detail after navigation — buyer-polished shell hides raw manifest UUID in the DOM. */
export async function expectLiveManifestDetailPageReady(
  page: Page,
  manifestId: string,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const manifestMain = getAppMain(page);
  const normalizedManifestId = normalizeRunIdForCompare(manifestId);

  await waitForLiveManifestDetailHydration(page, manifestId, { timeoutMs });

  const heading = manifestMain
    .getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN })
    .first();

  await expect(async () => {
    const headingVisible = await heading.isVisible().catch(() => false);
    const overviewVisible = await manifestMain.locator("#manifest-overview").isVisible().catch(() => false);
    const hasSignedRecordRoute = /\/(?:signed-records|manifests)\//i.test(new URL(page.url()).pathname);

    expect(headingVisible || (overviewVisible && hasSignedRecordRoute)).toBe(true);
  }).toPass({ timeout: timeoutMs });

  await expect
    .poll(() => normalizeRunIdForCompare(new URL(page.url()).pathname).includes(normalizedManifestId), {
      timeout: timeoutMs,
    })
    .toBe(true);

  await expect(manifestMain.locator("#manifest-overview")).toBeVisible({ timeout: timeoutMs });
}
