import type { PilotScorecardJson } from "@/types/pilot-scorecard";

import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { BUYER_TERMINOLOGY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance-route-paths";

export const REVIEW_SCORECARD_PAGE_TITLE = BUYER_TERMINOLOGY.reviewScorecard;

export const REVIEW_SCORECARD_PAGE_SUBTITLE =
  "See review throughput, governance effectiveness, and estimated ROI at a glance.";

export const REVIEW_SCORECARD_EMPTY_VALUE = "—";

export const REVIEW_SCORECARD_NOT_MEASURED_LABEL = "Not measured";

export const REVIEW_SCORECARD_MEASURED_ZERO_DETAIL = "Measured — none yet in scope.";

export const REVIEW_SCORECARD_MEASURED_DETAIL = "Measured in the current workspace scope.";

export const REVIEW_SCORECARD_FINALIZED_HREF = REVIEWS_LIST_PATH;
export const REVIEW_SCORECARD_GOVERNANCE_HREF = GOVERNANCE_APPROVAL_QUEUE_PATH;
export const REVIEW_SCORECARD_FINDINGS_HREF = GOVERNANCE_FINDINGS_PATH;
export const REVIEW_SCORECARD_AUDIT_HREF = GOVERNANCE_AUDIT_PATH;
export const REVIEW_SCORECARD_START_REVIEW_HREF = REVIEWS_NEW_PATH;
export const REVIEW_SCORECARD_ROI_ASSUMPTIONS_HREF = "#roi-assumptions";

export type ReviewScorecardMetricState = "unavailable" | "measuredZero" | "measured";

export type ReviewScorecardMetricDisplay = {
  readonly state: ReviewScorecardMetricState;
  readonly value: string;
  readonly detail: string;
  readonly empty: boolean;
  readonly useKpiEmphasis: boolean;
};

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
  readonly metricState: ReviewScorecardMetricState;
  readonly useKpiEmphasis: boolean;
  readonly href: string;
  readonly drillDownLabel: string;
  readonly methodologyKey?: string;
  readonly sourceDisclosure?: string;
};

export function hasCommittedReviews(data: PilotScorecardJson): boolean {
  return data.totalRunsCommitted > 0;
}

export function hasReviewActivity(data: PilotScorecardJson): boolean {
  return hasCommittedReviews(data) || data.totalManifestsCreated > 0;
}

export function buildReviewScorecardSummaryRow(
  data: PilotScorecardJson,
  annualSavingsLabel: string | null,
): ReviewScorecardSummaryRow {
  let estimatedReviewTimeSavingsLabel = REVIEW_SCORECARD_EMPTY_VALUE;
  let estimatedReviewTimeSavingsDetail =
    "Configure ROI assumptions below to preview annual review-time savings for sponsor discussions.";
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

function resolveCountMetricDisplay(
  count: number,
  measurementActive: boolean,
  unavailableDetail: string,
): ReviewScorecardMetricDisplay {
  if (!measurementActive && count === 0) {
    return {
      state: "unavailable",
      value: REVIEW_SCORECARD_EMPTY_VALUE,
      detail: unavailableDetail,
      empty: true,
      useKpiEmphasis: false,
    };
  }

  if (count === 0) {
    return {
      state: "measuredZero",
      value: "0",
      detail: REVIEW_SCORECARD_MEASURED_ZERO_DETAIL,
      empty: false,
      useKpiEmphasis: false,
    };
  }

  return {
    state: "measured",
    value: String(count),
    detail: REVIEW_SCORECARD_MEASURED_DETAIL,
    empty: false,
    useKpiEmphasis: true,
  };
}

function formatCycleTimeValue(minutes: number): string {
  if (minutes < 1) {
    return "< 1 min";
  }

  if (minutes < 60) {
    return `${minutes.toFixed(0)} min`;
  }

  const hours = minutes / 60;

  return `${hours.toFixed(1)} h`;
}

function resolveCycleTimeDisplay(
  minutes: number | null,
  finalizedPackageCount: number,
): ReviewScorecardMetricDisplay {
  if (minutes === null || !Number.isFinite(minutes)) {
    return {
      state: "unavailable",
      value: REVIEW_SCORECARD_EMPTY_VALUE,
      detail: "Average review cycle time appears after a finalized signed review record.",
      empty: true,
      useKpiEmphasis: false,
    };
  }

  const sampleSize = finalizedPackageCount;
  const detail =
    sampleSize > 0
      ? `Mean across ${sampleSize} finalized package${sampleSize === 1 ? "" : "s"}.`
      : "Average elapsed time from review start to finalized package.";

  return {
    state: "measured",
    value: formatCycleTimeValue(minutes),
    detail,
    empty: false,
    useKpiEmphasis: sampleSize >= 3,
  };
}

function resolveMetricSourceDisclosure(
  metricSources: PilotScorecardJson["metricSources"],
  key: string,
): string | undefined {
  if (metricSources === undefined) {
    return undefined;
  }

  const source = metricSources[key]?.trim();

  if (source === undefined || source.length === 0) {
    return undefined;
  }

  return source;
}

export function buildReviewScorecardOperationalMetrics(data: PilotScorecardJson): ReviewScorecardOperationalMetric[] {
  const reviewActivity = hasReviewActivity(data);
  const committed = resolveCountMetricDisplay(
    data.totalRunsCommitted,
    reviewActivity,
    "Start an architecture review to begin tracking throughput.",
  );
  const affirmed = resolveCountMetricDisplay(
    data.totalFindingsResolved,
    hasCommittedReviews(data),
    "Affirm findings from a review to begin tracking decisions.",
  );
  const cycleTime = resolveCycleTimeDisplay(data.averageTimeToManifestMinutes, data.totalManifestsCreated);
  const audit = resolveCountMetricDisplay(
    data.totalAuditEventsGenerated,
    hasCommittedReviews(data),
    "Audit activity appears as architects work through reviews.",
  );

  return [
    {
      key: "totalRunsCommitted",
      title: "Committed reviews",
      value: committed.value,
      detail: committed.detail,
      empty: committed.empty,
      metricState: committed.state,
      useKpiEmphasis: committed.useKpiEmphasis,
      href: committed.empty ? REVIEW_SCORECARD_START_REVIEW_HREF : REVIEW_SCORECARD_FINALIZED_HREF,
      drillDownLabel: committed.empty ? "Start architecture review" : "View architecture reviews",
      methodologyKey: "totalRunsCommitted",
      sourceDisclosure: resolveMetricSourceDisclosure(data.metricSources, "totalRunsCommitted"),
    },
    {
      key: "totalFindingsResolved",
      title: "Affirmed findings",
      value: affirmed.value,
      detail: affirmed.detail,
      empty: affirmed.empty,
      metricState: affirmed.state,
      useKpiEmphasis: affirmed.useKpiEmphasis,
      href: REVIEW_SCORECARD_FINDINGS_HREF,
      drillDownLabel: "View findings register",
      methodologyKey: "totalFindingsResolved",
      sourceDisclosure: resolveMetricSourceDisclosure(data.metricSources, "totalFindingsResolved"),
    },
    {
      key: "averageTimeToManifestMinutes",
      title: "Average review cycle time",
      value: cycleTime.value,
      detail: cycleTime.detail,
      empty: cycleTime.empty,
      metricState: cycleTime.state,
      useKpiEmphasis: cycleTime.useKpiEmphasis,
      href: cycleTime.empty ? REVIEW_SCORECARD_START_REVIEW_HREF : REVIEW_SCORECARD_FINALIZED_HREF,
      drillDownLabel: cycleTime.empty ? "Start architecture review" : "View architecture reviews",
      methodologyKey: "averageTimeToManifestMinutes",
      sourceDisclosure: resolveMetricSourceDisclosure(data.metricSources, "averageTimeToManifestMinutes"),
    },
    {
      key: "totalAuditEventsGenerated",
      title: "Audit events recorded",
      value: audit.value,
      detail: audit.detail,
      empty: audit.empty,
      metricState: audit.state,
      useKpiEmphasis: audit.useKpiEmphasis,
      href: REVIEW_SCORECARD_AUDIT_HREF,
      drillDownLabel: "View audit trail",
      methodologyKey: "totalAuditEventsGenerated",
      sourceDisclosure: resolveMetricSourceDisclosure(data.metricSources, "totalAuditEventsGenerated"),
    },
  ];
}

export function buildReviewScorecardScopeCue(data: PilotScorecardJson): string {
  if (data.firstCommitUtc !== null && data.firstCommitUtc !== undefined && data.firstCommitUtc.length > 0) {
    const days = data.daysSinceFirstCommit;

    if (typeof days === "number" && Number.isFinite(days) && days >= 0) {
      return `Workspace all-time · ${days} day${days === 1 ? "" : "s"} of review activity`;
    }

    return "Workspace all-time · since review activity began";
  }

  return "Workspace all-time · metrics appear after the first review activity";
}

export function buildReviewScorecardMetricsAsOfLabel(
  metricsAsOfUtc: string | null | undefined,
): string | null {
  if (metricsAsOfUtc == null || metricsAsOfUtc.trim().length === 0) {
    return null;
  }

  return `Metrics as of ${formatIsoUtcForDisplay(metricsAsOfUtc)}`;
}

export function buildReviewScorecardMethodologyLines(
  metricSources: PilotScorecardJson["metricSources"],
): string[] {
  // Sponsor-facing copy only — never dump raw API metricSources keys (tenantId, roiEstimate, …).
  void metricSources;

  return [
    "Committed reviews and finalized packages count workspace-scoped review activity.",
    "Affirmed findings reflect positive disposition on generated findings.",
    "Estimated savings use saved ROI assumptions when all three inputs are provided.",
    "Per-tile provenance labels state whether each metric is measured, modeled, or unavailable.",
  ];
}

export function formatQuarterlySavingsFromAnnualUsd(annualUsd: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(annualUsd / 4);
}

export function summarizePrimaryKpiDisplay(
  count: number,
  unavailableDetail: string,
  measurementActive: boolean,
): ReviewScorecardMetricDisplay {
  return resolveCountMetricDisplay(count, measurementActive, unavailableDetail);
}
