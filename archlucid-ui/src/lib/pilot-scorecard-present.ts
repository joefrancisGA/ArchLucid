import type { PilotScorecardJson } from "@/types/pilot-scorecard";

import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
} from "@/lib/governance-route-paths";
import { GOVERNANCE_FINDINGS_TRAFFIC_PATH } from "@/lib/ui-route-traffic-governance-findings";

export const REVIEW_SCORECARD_PAGE_TITLE = BUYER_TERMINOLOGY.reviewScorecard;

export const REVIEW_SCORECARD_PAGE_SUBTITLE =
  "See review throughput, governance effectiveness, and estimated ROI at a glance.";

export const REVIEW_SCORECARD_EMPTY_VALUE = "—";

export const REVIEW_SCORECARD_FINALIZED_HREF = REVIEWS_LIST_PATH;
export const REVIEW_SCORECARD_GOVERNANCE_HREF = GOVERNANCE_APPROVAL_QUEUE_PATH;
export const REVIEW_SCORECARD_FINDINGS_HREF = GOVERNANCE_FINDINGS_TRAFFIC_PATH;
export const REVIEW_SCORECARD_AUDIT_HREF = GOVERNANCE_AUDIT_PATH;
export const REVIEW_SCORECARD_START_REVIEW_HREF = REVIEWS_NEW_PATH;
export const REVIEW_SCORECARD_ROI_ASSUMPTIONS_HREF = "#roi-assumptions";

export type ReviewScorecardSummaryRow = {
  readonly finalizedPackages: number;
  readonly affirmedFindings: number;
  readonly governanceApprovals: number;
  readonly estimatedReviewTimeSavingsLabel: string;
  readonly estimatedReviewTimeSavingsDetail: string;
  readonly estimatedReviewTimeSavingsReady: boolean;
};

export type ReviewScorecardOperationalMetric = {
  readonly key: string;
  readonly title: string;
  readonly value: string;
  readonly detail: string;
  readonly empty: boolean;
  readonly href: string;
  readonly methodologyKey?: string;
};

export function hasCommittedReviews(data: PilotScorecardJson): boolean {
  return data.totalRunsCommitted > 0;
}

export function buildReviewScorecardSummaryRow(
  data: PilotScorecardJson,
  annualSavingsLabel: string | null,
): ReviewScorecardSummaryRow {
  let estimatedReviewTimeSavingsLabel = REVIEW_SCORECARD_EMPTY_VALUE;
  let estimatedReviewTimeSavingsDetail =
    "Set ROI assumptions below to preview annual review-time savings for sponsor discussions.";
  let estimatedReviewTimeSavingsReady = false;

  if (annualSavingsLabel !== null) {
    estimatedReviewTimeSavingsLabel = annualSavingsLabel;
    estimatedReviewTimeSavingsDetail =
      "Directional annual review-time savings from saved ROI assumptions — for pilot value discussions, not financial reporting.";
    estimatedReviewTimeSavingsReady = true;
  } else if (data.baselines !== null) {
    estimatedReviewTimeSavingsDetail =
      "Complete all three ROI assumptions below to preview and save estimated savings.";
  }

  return {
    finalizedPackages: data.totalManifestsCreated,
    affirmedFindings: data.totalFindingsResolved,
    governanceApprovals: data.totalGovernanceApprovalsCompleted,
    estimatedReviewTimeSavingsLabel,
    estimatedReviewTimeSavingsDetail,
    estimatedReviewTimeSavingsReady,
  };
}

function formatCycleTime(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) {
    return REVIEW_SCORECARD_EMPTY_VALUE;
  }

  if (minutes < 60) {
    return `${minutes.toFixed(0)} min`;
  }

  const hours = minutes / 60;

  return `${hours.toFixed(1)} h`;
}

function zeroAwareCountMetric(
  count: number,
  zeroDetail: string,
): { value: string; detail: string; empty: boolean } {
  if (count === 0) {
    return { value: REVIEW_SCORECARD_EMPTY_VALUE, detail: zeroDetail, empty: true };
  }

  return { value: String(count), detail: "Measured in the current workspace scope.", empty: false };
}

export function buildReviewScorecardOperationalMetrics(data: PilotScorecardJson): ReviewScorecardOperationalMetric[] {
  // Primary row already covers finalized packages + governance approvals — keep ops metrics complementary.
  const committed = zeroAwareCountMetric(
    data.totalRunsCommitted,
    "Commit a review to begin tracking throughput.",
  );
  const affirmed = zeroAwareCountMetric(
    data.totalFindingsResolved,
    "Affirm findings from a review to begin tracking decisions.",
  );
  const cycleTimeValue = formatCycleTime(data.averageTimeToManifestMinutes);
  const cycleTimeEmpty = data.averageTimeToManifestMinutes === null;
  const cycleTimeDetail = cycleTimeEmpty
    ? "Average review cycle time appears after a finalized package."
    : "Average elapsed time from commit to finalized package.";
  const audit = zeroAwareCountMetric(
    data.totalAuditEventsGenerated,
    "Audit activity appears as architects work through reviews.",
  );

  return [
    {
      key: "totalRunsCommitted",
      title: "Committed reviews",
      value: committed.value,
      detail: committed.detail,
      empty: committed.empty,
      href: committed.empty ? REVIEW_SCORECARD_START_REVIEW_HREF : REVIEW_SCORECARD_FINALIZED_HREF,
      methodologyKey: "totalRunsCommitted",
    },
    {
      key: "totalFindingsResolved",
      title: "Affirmed findings",
      value: affirmed.value,
      detail: affirmed.detail,
      empty: affirmed.empty,
      href: REVIEW_SCORECARD_FINDINGS_HREF,
      methodologyKey: "totalFindingsResolved",
    },
    {
      key: "averageTimeToManifestMinutes",
      title: "Average review cycle time",
      value: cycleTimeValue,
      detail: cycleTimeDetail,
      empty: cycleTimeEmpty,
      href: cycleTimeEmpty ? REVIEW_SCORECARD_START_REVIEW_HREF : REVIEW_SCORECARD_FINALIZED_HREF,
      methodologyKey: "averageTimeToManifestMinutes",
    },
    {
      key: "totalAuditEventsGenerated",
      title: "Audit events recorded",
      value: audit.value,
      detail: audit.detail,
      empty: audit.empty,
      href: REVIEW_SCORECARD_AUDIT_HREF,
      methodologyKey: "totalAuditEventsGenerated",
    },
  ];
}

export function buildReviewScorecardScopeCue(data: PilotScorecardJson): string {
  if (data.firstCommitUtc !== null && data.firstCommitUtc !== undefined && data.firstCommitUtc.length > 0) {
    const days = data.daysSinceFirstCommit;

    if (typeof days === "number" && Number.isFinite(days) && days >= 0) {
      return `Workspace all-time · ${days} day${days === 1 ? "" : "s"} since first commit`;
    }

    return "Workspace all-time · since first commit";
  }

  return "Workspace all-time · metrics appear after the first commit";
}

export function buildReviewScorecardMethodologyLines(
  metricSources: PilotScorecardJson["metricSources"],
): string[] {
  if (metricSources === undefined) {
    return [
      "Committed reviews and finalized packages count tenant-scoped review activity.",
      "Affirmed findings reflect positive feedback on generated findings.",
      "Estimated savings use saved ROI assumptions when all three inputs are provided.",
    ];
  }

  return Object.entries(metricSources).map(([metric, source]) => `${metric}: ${source}`);
}

export function formatQuarterlySavingsFromAnnualUsd(annualUsd: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(annualUsd / 4);
}

export function summarizePrimaryKpiDisplay(count: number, zeroDetail: string): {
  value: string;
  detail: string;
  empty: boolean;
} {
  if (count === 0) {
    return { value: REVIEW_SCORECARD_EMPTY_VALUE, detail: zeroDetail, empty: true };
  }

  return {
    value: String(count),
    detail: "Measured in the current workspace scope.",
    empty: false,
  };
}
