import type { PilotScorecardJson } from "@/types/pilot-scorecard";

import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";

export const REVIEW_SCORECARD_PAGE_TITLE = BUYER_TERMINOLOGY.reviewScorecard;

export const REVIEW_SCORECARD_PAGE_SUBTITLE =
  "See review throughput, governance effectiveness, and estimated ROI at a glance.";

export const REVIEW_SCORECARD_EMPTY_VALUE = "—";

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
    "Save ROI assumptions below to estimate annual review-time savings for sponsor discussions.";
  let estimatedReviewTimeSavingsReady = false;

  if (annualSavingsLabel !== null) {
    estimatedReviewTimeSavingsLabel = annualSavingsLabel;
    estimatedReviewTimeSavingsDetail =
      "Directional annual review-time savings from saved ROI assumptions — for pilot value discussions, not financial reporting.";
    estimatedReviewTimeSavingsReady = true;
  } else if (data.baselines !== null) {
    estimatedReviewTimeSavingsDetail =
      "Complete all three ROI assumptions and save to calculate estimated savings.";
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
  const committed = zeroAwareCountMetric(
    data.totalRunsCommitted,
    "Commit a review to begin tracking throughput.",
  );
  const finalized = zeroAwareCountMetric(
    data.totalManifestsCreated,
    "Finalize a package to begin tracking completed reviews.",
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

  return [
    {
      key: "totalRunsCommitted",
      title: "Committed reviews",
      value: committed.value,
      detail: committed.detail,
      empty: committed.empty,
      methodologyKey: "totalRunsCommitted",
    },
    {
      key: "totalManifestsCreated",
      title: "Finalized packages",
      value: finalized.value,
      detail: finalized.detail,
      empty: finalized.empty,
      methodologyKey: "totalManifestsCreated",
    },
    {
      key: "totalFindingsResolved",
      title: "Affirmed findings",
      value: affirmed.value,
      detail: affirmed.detail,
      empty: affirmed.empty,
      methodologyKey: "totalFindingsResolved",
    },
    {
      key: "averageTimeToManifestMinutes",
      title: "Average review cycle time",
      value: cycleTimeValue,
      detail: cycleTimeDetail,
      empty: cycleTimeEmpty,
      methodologyKey: "averageTimeToManifestMinutes",
    },
    {
      key: "totalGovernanceApprovalsCompleted",
      title: "Governance approvals completed",
      ...zeroAwareCountMetric(
        data.totalGovernanceApprovalsCompleted,
        "Complete your first approval to begin tracking governance metrics.",
      ),
      methodologyKey: "totalGovernanceApprovalsCompleted",
    },
    {
      key: "totalAuditEventsGenerated",
      title: "Audit events recorded",
      ...zeroAwareCountMetric(
        data.totalAuditEventsGenerated,
        "Audit activity appears as operators work through reviews.",
      ),
      methodologyKey: "totalAuditEventsGenerated",
    },
  ];
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
