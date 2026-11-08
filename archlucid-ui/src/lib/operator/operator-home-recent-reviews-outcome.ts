import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import {
  deriveRunsDashboardTabCounts,
  normalizeOperatorHomeNonNegativeCount,
  type RunsDashboardTabCounts,
} from "@/lib/operator/run-home-status";
import { formatOperatorHomeGovernanceApprovalWarningCount } from "@/lib/operator/operator-home-governance-approval-warning-copy";
import { OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN } from "@/lib/metric-count-presentation";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { isShowcaseSampleOfAnyKind } from "@/lib/demo-run-canonical";
import { runMatchesOperatorHomeExampleDescription } from "@/lib/operator/operator-home-example-request";
import {
  normalizeOperatorHomeWorkspaceMetricsForDisplay,
  type OperatorHomeWorkspaceMetricsSnapshot,
} from "@/lib/operator/operator-home-workspace-metrics";
import { buildTrimmedRunIdSet } from "@/lib/operator/home-attention-dedup";
import type { RunSummary } from "@/types/authority";

export type FormatOperatorHomeRecentReviewsOutcomeOptions = {
  /** Demo/seeded or static showcase rows only — not tenant-authored reviews. */
  readonly exampleReviewOnly?: boolean;
  /** Featured recent-review rows visible in the preview list. */
  readonly visibleCount?: number;
  /** Total tenant rows in the recent preview pool (before featured cap). */
  readonly recentTotalCount?: number;
  /** Approval queue pressure from attention summary. */
  readonly awaitingApprovalCount?: number;
  /** Omit awaiting-approval segment when the lead card already surfaces that count (P1-6). */
  readonly suppressAwaitingApprovalCount?: boolean;
};

function resolveRecentPreviewCapCounts(
  options?: FormatOperatorHomeRecentReviewsOutcomeOptions,
): { readonly visible: number; readonly previewTotal: number } | null {
  if (options?.visibleCount === undefined) {
    return null;
  }

  const visible = normalizeOperatorHomeNonNegativeCount(options.visibleCount);
  const previewTotal = normalizeOperatorHomeNonNegativeCount(
    options.recentTotalCount ?? options.visibleCount,
  );

  return { visible, previewTotal };
}

/**
 * One-line portfolio outcome for Recent reviews — population, lifecycle, pressure, and preview cap.
 */
export function formatOperatorHomeRecentReviewsOutcome(
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
  options?: FormatOperatorHomeRecentReviewsOutcomeOptions,
): string {
  const displayMetrics = normalizeOperatorHomeWorkspaceMetricsForDisplay(metrics);

  if (options?.exampleReviewOnly === true) {
    return OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME;
  }

  if (!displayMetrics.hasReviews) {
    return "No reviews in this workspace yet.";
  }

  const parts: string[] = [];
  const total = displayMetrics.reviewPackagesTotal;
  parts.push(`${total} review${total === 1 ? "" : "s"}`);

  if (displayMetrics.reviewPackagesCommitted > 0) {
    const sealedNoun =
      displayMetrics.reviewPackagesCommitted === 1
        ? OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN.singular
        : OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN.plural;
    parts.push(`${displayMetrics.reviewPackagesCommitted} ${sealedNoun}`);
  }

  if (displayMetrics.reviewPackagesActive > 0) {
    parts.push(`${displayMetrics.reviewPackagesActive} active`);
  }

  parts.push(
    `${displayMetrics.openFindings} open finding${displayMetrics.openFindings === 1 ? "" : "s"}`,
  );

  if (displayMetrics.governanceWarnings > 0) {
    parts.push(
      `with ${formatOperatorHomeGovernanceApprovalWarningCount(displayMetrics.governanceWarnings)}`,
    );
  }

  const awaitingApprovalCount = normalizeOperatorHomeNonNegativeCount(options?.awaitingApprovalCount);

  if (awaitingApprovalCount > 0 && options?.suppressAwaitingApprovalCount !== true) {
    parts.push(
      `${awaitingApprovalCount} awaiting approval`,
    );
  }

  const previewCap = resolveRecentPreviewCapCounts(options);

  if (previewCap !== null) {
    const { visible, previewTotal } = previewCap;

    if (previewTotal > visible) {
      parts.push(`showing ${visible} of ${previewTotal}`);
    } else {
      parts.push(`showing ${visible}`);
    }
  }

  return parts.join(" · ");
}

export type OperatorHomeRecentReviewsOutcomeHrefKind =
  | "all-reviews"
  | "tab"
  | "governance-warnings-filter"
  | "awaiting-approval";

export type OperatorHomeRecentReviewsOutcomePart = {
  readonly key: string;
  readonly text: string;
  readonly hrefKind?: OperatorHomeRecentReviewsOutcomeHrefKind;
  readonly tabId?: RunsDashboardTabId;
};

/** Structured caption segments — each count is reachable in one click from Home. */
export function buildOperatorHomeRecentReviewsOutcomeParts(
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
  options?: FormatOperatorHomeRecentReviewsOutcomeOptions,
): readonly OperatorHomeRecentReviewsOutcomePart[] {
  const displayMetrics = normalizeOperatorHomeWorkspaceMetricsForDisplay(metrics);

  if (options?.exampleReviewOnly === true) {
    return [{ key: "example-only", text: OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME }];
  }

  if (!displayMetrics.hasReviews) {
    return [];
  }

  const parts: OperatorHomeRecentReviewsOutcomePart[] = [];
  const total = displayMetrics.reviewPackagesTotal;

  parts.push({
    key: "reviews-total",
    text: `${total} review${total === 1 ? "" : "s"}`,
    hrefKind: "all-reviews",
  });

  if (displayMetrics.reviewPackagesCommitted > 0) {
    const sealedNoun =
      displayMetrics.reviewPackagesCommitted === 1
        ? OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN.singular
        : OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN.plural;

    parts.push({
      key: "sealed-records",
      text: `${displayMetrics.reviewPackagesCommitted} ${sealedNoun}`,
      hrefKind: "all-reviews",
    });
  }

  if (displayMetrics.reviewPackagesActive > 0) {
    parts.push({
      key: "active",
      text: `${displayMetrics.reviewPackagesActive} active`,
      hrefKind: "tab",
      tabId: "all",
    });
  }

  parts.push({
    key: "open-findings",
    text: `${displayMetrics.openFindings} open finding${displayMetrics.openFindings === 1 ? "" : "s"}`,
    hrefKind: "tab",
    tabId: "attention",
  });

  if (displayMetrics.governanceWarnings > 0) {
    parts.push({
      key: "governance-warnings",
      text: `with ${formatOperatorHomeGovernanceApprovalWarningCount(displayMetrics.governanceWarnings)}`,
      hrefKind: "governance-warnings-filter",
    });
  }

  const awaitingApprovalCount = normalizeOperatorHomeNonNegativeCount(options?.awaitingApprovalCount);

  if (awaitingApprovalCount > 0 && options?.suppressAwaitingApprovalCount !== true) {
    parts.push({
      key: "awaiting-approval",
      text: `${awaitingApprovalCount} awaiting approval`,
      hrefKind: "awaiting-approval",
    });
  }

  const previewCap = resolveRecentPreviewCapCounts(options);

  if (previewCap !== null) {
    const { visible, previewTotal } = previewCap;

    if (previewTotal > visible) {
      parts.push({
        key: "showing-cap",
        text: `showing ${visible} of ${previewTotal}`,
      });
    } else {
      parts.push({
        key: "showing",
        text: `showing ${visible}`,
        hrefKind: "tab",
        tabId: "all",
      });
    }
  }

  return parts;
}

/** True when every list row is a demo/seeded inject or the static showcase sample. */
export function isExampleOnlyOverviewRunList(items: readonly RunSummary[]): boolean {
  if (items.length === 0) {
    return false;
  }

  return items.every(
    (run) =>
      isDemoSeededOverviewInjectedRun(run)
      || isShowcaseSampleOfAnyKind(run.runId ?? "")
      || runMatchesOperatorHomeExampleDescription(run),
  );
}

/** Demo inject, static showcase id, or API showcase story matched by description — not tenant KPI scope. */
export function isNonTenantOverviewRun(run: RunSummary): boolean {
  return (
    isDemoSeededOverviewInjectedRun(run)
    || isShowcaseSampleOfAnyKind(run.runId ?? "")
    || runMatchesOperatorHomeExampleDescription(run)
  );
}

/** Tenant-authored rows only — excludes demo inject, curated showcase sample, and description-matched example stories. */
export function filterTenantOverviewRuns(items: readonly RunSummary[]): RunSummary[] {
  return items.filter((run) => !isNonTenantOverviewRun(run));
}

/** Featured recent-review rows on Overview (full list lives on Architecture packages). */
export const OPERATOR_HOME_RECENT_FEATURED_LIMIT = 2;

export type HomePreviewTabCounts = RunsDashboardTabCounts & {
  readonly recentVisibleCount: number;
  readonly recentTotalCount: number;
};

export type DeriveHomePreviewTabCountsInput = {
  readonly previewItems: readonly RunSummary[];
  /** When the buyer proof card already names the showcase sample, omit that row from tab counts. */
  readonly excludeShowcaseRunId?: string | undefined;
  readonly awaitingApprovalRunIds?: readonly string[];
  /** Workspace-wide awaiting-approval count when preview rows have not loaded queue membership yet. */
  readonly awaitingApprovalCount?: number;
};

function countAwaitingApprovalPreviewRuns(
  items: readonly RunSummary[],
  awaitingApprovalRunIds: readonly string[] | undefined,
): number {
  if (awaitingApprovalRunIds === undefined || awaitingApprovalRunIds.length === 0) {
    return 0;
  }

  const awaitingIds = buildTrimmedRunIdSet(awaitingApprovalRunIds);

  return items.filter((run) => {
    const runId = run.runId?.trim() ?? "";

    return runId.length > 0 && awaitingIds.has(runId);
  }).length;
}

/**
 * Tab counts for the home recent-reviews preview — uses deduped preview rows and caps the
 * Recent tab at the featured limit so labels read `Recent (2 of N)` instead of a silent cap.
 */
export function deriveHomePreviewTabCounts(input: DeriveHomePreviewTabCountsInput): HomePreviewTabCounts {
  const activePreviewItems = input.previewItems.filter((run) => run.isArchived !== true);
  const excludeShowcaseRunId = input.excludeShowcaseRunId?.trim() ?? "";
  const listItems =
    excludeShowcaseRunId.length > 0
      ? activePreviewItems.filter((run) => (run.runId?.trim() ?? "") !== excludeShowcaseRunId)
      : activePreviewItems;
  const baseCounts = deriveRunsDashboardTabCounts(listItems);
  const awaitingApprovalRunIds = input.awaitingApprovalRunIds;
  const previewAwaitingApproval = countAwaitingApprovalPreviewRuns(listItems, awaitingApprovalRunIds);
  const workspaceAwaitingApproval = normalizeOperatorHomeNonNegativeCount(input.awaitingApprovalCount);

  let awaitingApproval = previewAwaitingApproval;

  if (
    previewAwaitingApproval === 0
    && awaitingApprovalRunIds !== undefined
    && awaitingApprovalRunIds.length > 0
  ) {
    // Queue membership loaded but preview rows omit queue members — align tab label with workspace summary.
    awaitingApproval = workspaceAwaitingApproval;
  }
  const recentTotalCount = listItems.length;
  const recentVisibleCount = Math.min(listItems.length, OPERATOR_HOME_RECENT_FEATURED_LIMIT);

  return {
    ...baseCounts,
    "awaiting-approval": awaitingApproval,
    all: recentVisibleCount,
    recentVisibleCount,
    recentTotalCount,
  };
}
