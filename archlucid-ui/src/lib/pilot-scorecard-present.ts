import type { PilotScorecardJson } from "@/types/pilot-scorecard";

import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";

export const REVIEW_SCORECARD_PAGE_TITLE = BUYER_TERMINOLOGY.reviewScorecard;

export const REVIEW_SCORECARD_PAGE_SUBTITLE =
  "Track architecture package throughput, evidence-backed decisions, governance approvals, and estimated review-time savings.";

export type ReviewScorecardSummaryRow = {
  readonly finalizedPackages: number;
  readonly affirmedFindings: number;
  readonly governanceApprovals: number;
  readonly estimatedReviewTimeSavingsLabel: string;
  readonly estimatedReviewTimeSavingsDetail: string;
};

export type ReviewScorecardOperationalMetric = {
  readonly key: string;
  readonly title: string;
  readonly value: string;
  readonly detail: string;
  readonly methodologyKey?: string;
};

export function hasCommittedReviews(data: PilotScorecardJson): boolean {
  return data.totalRunsCommitted > 0;
}

export function buildReviewScorecardSummaryRow(
  data: PilotScorecardJson,
  annualSavingsLabel: string | null,
): ReviewScorecardSummaryRow {
  let estimatedReviewTimeSavingsLabel = "—";
  let estimatedReviewTimeSavingsDetail = "ROI estimate available after baselines are saved.";

  if (annualSavingsLabel !== null) {
    estimatedReviewTimeSavingsLabel = annualSavingsLabel;
    estimatedReviewTimeSavingsDetail = "Estimated annual review-time savings from saved ROI assumptions.";
  } else if (data.baselines !== null) {
    estimatedReviewTimeSavingsDetail = "Complete ROI assumptions to calculate estimated savings.";
  }

  return {
    finalizedPackages: data.totalManifestsCreated,
    affirmedFindings: data.totalFindingsResolved,
    governanceApprovals: data.totalGovernanceApprovalsCompleted,
    estimatedReviewTimeSavingsLabel,
    estimatedReviewTimeSavingsDetail,
  };
}

function formatCycleTime(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) {
    return "—";
  }

  if (minutes < 60) {
    return `${minutes.toFixed(0)} min`;
  }

  const hours = minutes / 60;

  return `${hours.toFixed(1)} h`;
}

function zeroAwareCountLabel(count: number, zeroDetail: string): { value: string; detail: string } {
  if (count === 0) {
    return { value: "0", detail: zeroDetail };
  }

  return { value: String(count), detail: "Measured in the current workspace scope." };
}

export function buildReviewScorecardOperationalMetrics(data: PilotScorecardJson): ReviewScorecardOperationalMetric[] {
  const committed = zeroAwareCountLabel(
    data.totalRunsCommitted,
    "No committed reviews yet.",
  );
  const finalized = zeroAwareCountLabel(
    data.totalManifestsCreated,
    "No finalized reviews yet.",
  );
  const affirmed = zeroAwareCountLabel(
    data.totalFindingsResolved,
    "No affirmed findings yet.",
  );
  const cycleTimeValue = formatCycleTime(data.averageTimeToManifestMinutes);
  const cycleTimeDetail =
    data.averageTimeToManifestMinutes === null
      ? "Average review cycle time appears after a finalized package."
      : "Average elapsed time from commit to finalized package.";

  return [
    {
      key: "totalRunsCommitted",
      title: "Committed reviews",
      value: committed.value,
      detail: committed.detail,
      methodologyKey: "totalRunsCommitted",
    },
    {
      key: "totalManifestsCreated",
      title: "Finalized packages",
      value: finalized.value,
      detail: finalized.detail,
      methodologyKey: "totalManifestsCreated",
    },
    {
      key: "totalFindingsResolved",
      title: "Affirmed findings",
      value: affirmed.value,
      detail: affirmed.detail,
      methodologyKey: "totalFindingsResolved",
    },
    {
      key: "averageTimeToManifestMinutes",
      title: "Average review cycle time",
      value: cycleTimeValue,
      detail: cycleTimeDetail,
      methodologyKey: "averageTimeToManifestMinutes",
    },
    {
      key: "totalGovernanceApprovalsCompleted",
      title: "Governance approvals completed",
      ...zeroAwareCountLabel(data.totalGovernanceApprovalsCompleted, "No governance approvals completed yet."),
      methodologyKey: "totalGovernanceApprovalsCompleted",
    },
    {
      key: "totalAuditEventsGenerated",
      title: "Audit events recorded",
      ...zeroAwareCountLabel(data.totalAuditEventsGenerated, "No audit events recorded yet."),
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
