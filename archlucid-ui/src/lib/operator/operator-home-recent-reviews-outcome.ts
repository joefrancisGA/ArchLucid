import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import {
  deriveRunsDashboardTabCounts,
  type RunsDashboardTabCounts,
} from "@/components/operator-home/runs-dashboard-helpers";
import { formatOperatorHomeGovernanceApprovalWarningCount } from "@/lib/operator/operator-home-governance-approval-warning-copy";
import { OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN } from "@/lib/metric-count-presentation";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { isShowcaseSampleOfAnyKind } from "@/lib/demo-run-canonical";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";
import type { RunSummary } from "@/types/authority";

export type FormatOperatorHomeRecentReviewsOutcomeOptions = {
  /** Demo/seeded or static showcase rows only — not tenant-authored reviews. */
  readonly exampleReviewOnly?: boolean;
  /** Featured recent-review rows visible in the preview list. */
  readonly visibleCount?: number;
  /** Total tenant rows in the recent preview pool (before featured cap). */
  readonly recentTotalCount?: number;
  /** Governance approval queue pressure from attention summary. */
  readonly awaitingApprovalCount?: number;
  /** Omit awaiting-approval segment when the lead card already surfaces that count (P1-6). */
  readonly suppressAwaitingApprovalCount?: boolean;
};

/**
 * One-line portfolio outcome for Recent reviews — population, lifecycle, pressure, and preview cap.
 */
export function formatOperatorHomeRecentReviewsOutcome(
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
  options?: FormatOperatorHomeRecentReviewsOutcomeOptions,
): string {
  if (options?.exampleReviewOnly === true) {
    return OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME;
  }

  if (!metrics.hasReviews) {
    return "No reviews in this workspace yet.";
  }

  const parts: string[] = [];
  const total = metrics.reviewPackagesTotal;
  parts.push(`${total} review${total === 1 ? "" : "s"}`);

  if (metrics.reviewPackagesCommitted > 0) {
    const sealedNoun =
      metrics.reviewPackagesCommitted === 1
        ? OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN.singular
        : OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN.plural;
    parts.push(`${metrics.reviewPackagesCommitted} ${sealedNoun}`);
  }

  if (metrics.reviewPackagesActive > 0) {
    parts.push(`${metrics.reviewPackagesActive} active`);
  }

  parts.push(`${metrics.openFindings} open finding${metrics.openFindings === 1 ? "" : "s"}`);

  if (metrics.governanceWarnings > 0) {
    parts.push(`with ${formatOperatorHomeGovernanceApprovalWarningCount(metrics.governanceWarnings)}`);
  }

  const awaitingApprovalCount = options?.awaitingApprovalCount ?? 0;

  if (awaitingApprovalCount > 0 && options?.suppressAwaitingApprovalCount !== true) {
    parts.push(
      `${awaitingApprovalCount} awaiting approval`,
    );
  }

  if (options?.visibleCount !== undefined) {
    const visible = options.visibleCount;
    const total = options.recentTotalCount ?? visible;

    if (total > visible) {
      parts.push(`showing ${visible} of ${total}`);
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
  if (options?.exampleReviewOnly === true) {
    return [{ key: "example-only", text: OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME }];
  }

  if (!metrics.hasReviews) {
    return [{ key: "empty", text: "No reviews in this workspace yet." }];
  }

  const parts: OperatorHomeRecentReviewsOutcomePart[] = [];
  const total = metrics.reviewPackagesTotal;

  parts.push({
    key: "reviews-total",
    text: `${total} review${total === 1 ? "" : "s"}`,
    hrefKind: "all-reviews",
  });

  if (metrics.reviewPackagesCommitted > 0) {
    const sealedNoun =
      metrics.reviewPackagesCommitted === 1
        ? OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN.singular
        : OPERATOR_HOME_SEALED_REVIEW_RECORD_NOUN.plural;

    parts.push({
      key: "sealed-records",
      text: `${metrics.reviewPackagesCommitted} ${sealedNoun}`,
      hrefKind: "all-reviews",
    });
  }

  if (metrics.reviewPackagesActive > 0) {
    parts.push({
      key: "active",
      text: `${metrics.reviewPackagesActive} active`,
      hrefKind: "tab",
      tabId: "all",
    });
  }

  parts.push({
    key: "open-findings",
    text: `${metrics.openFindings} open finding${metrics.openFindings === 1 ? "" : "s"}`,
    hrefKind: "tab",
    tabId: "attention",
  });

  if (metrics.governanceWarnings > 0) {
    parts.push({
      key: "governance-warnings",
      text: `with ${formatOperatorHomeGovernanceApprovalWarningCount(metrics.governanceWarnings)}`,
      hrefKind: "governance-warnings-filter",
    });
  }

  const awaitingApprovalCount = options?.awaitingApprovalCount ?? 0;

  if (awaitingApprovalCount > 0 && options?.suppressAwaitingApprovalCount !== true) {
    parts.push({
      key: "awaiting-approval",
      text: `${awaitingApprovalCount} awaiting approval`,
      hrefKind: "awaiting-approval",
    });
  }

  if (options?.visibleCount !== undefined) {
    const visible = options.visibleCount;
    const previewTotal = options.recentTotalCount ?? visible;

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
      isDemoSeededOverviewInjectedRun(run) || isShowcaseSampleOfAnyKind(run.runId ?? ""),
  );
}

/** Tenant-authored rows only — excludes demo inject and the curated showcase sample. */
export function filterTenantOverviewRuns(items: readonly RunSummary[]): RunSummary[] {
  return items.filter(
    (run) =>
      !isDemoSeededOverviewInjectedRun(run) && !isShowcaseSampleOfAnyKind(run.runId ?? ""),
  );
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
};

function countAwaitingApprovalPreviewRuns(
  items: readonly RunSummary[],
  awaitingApprovalRunIds: readonly string[] | undefined,
): number {
  if (awaitingApprovalRunIds === undefined || awaitingApprovalRunIds.length === 0) {
    return 0;
  }

  const awaitingIds = new Set(awaitingApprovalRunIds);

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
  const listItems =
    input.excludeShowcaseRunId !== undefined
      ? input.previewItems.filter((run) => run.runId !== input.excludeShowcaseRunId)
      : input.previewItems;
  const baseCounts = deriveRunsDashboardTabCounts(listItems);
  const awaitingApproval = countAwaitingApprovalPreviewRuns(listItems, input.awaitingApprovalRunIds);
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
