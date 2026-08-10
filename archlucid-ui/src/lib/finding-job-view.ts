import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import {
  humanReviewStatusDisplay,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";

export type FindingJobView =
  | "needs-my-decision"
  | "needs-governance"
  | "ready-for-sponsor-packet"
  | "deferred";

export const DEFAULT_FINDING_JOB_VIEW: FindingJobView = "needs-my-decision";

export const FINDING_JOB_VIEW_LABELS: Record<FindingJobView, string> = {
  "needs-my-decision": "Needs my decision",
  "needs-governance": "Needs governance",
  "ready-for-sponsor-packet": "Ready for sponsor packet",
  deferred: "Deferred",
};

/**
 * Job-view assignment priority (first match wins) — documented SoT for TB-2179.
 * A finding appears in exactly one primary job view at a time.
 */
export const FINDING_JOB_VIEW_ASSIGNMENT_ORDER: readonly FindingJobView[] = [
  "deferred",
  "ready-for-sponsor-packet",
  "needs-governance",
  "needs-my-decision",
];

const READY_DISPOSITIONS: readonly FindingDispositionKind[] = [
  "Accepted",
  "RejectedAsNotApplicable",
  "Remediated",
];

function normalizeDisposition(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function readDispositionFromReviewFinding(finding: QuickDecisionFinding): string | null {
  try {
    const parsed: unknown = JSON.parse(finding.aiReasoning.wireJson);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const disposition = (parsed as { latestDisposition?: unknown }).latestDisposition;

    return typeof disposition === "string" && disposition.trim().length > 0 ? disposition.trim() : null;
  } catch {
    return null;
  }
}

function isReadyDisposition(disposition: string): boolean {
  return READY_DISPOSITIONS.some((entry) => entry === disposition);
}

function isGovernanceOpenRow(row: GovernanceFindingQueueRow): boolean {
  if (row.recordKind !== "finding") {
    return false;
  }

  const normalized = row.status.toLowerCase();

  if (normalized.includes("recorded") || normalized.includes("closed") || normalized.includes("resolved")) {
    return false;
  }

  return true;
}

export function classifyReviewFindingJobView(finding: QuickDecisionFinding): FindingJobView {
  const disposition = normalizeDisposition(readDispositionFromReviewFinding(finding));
  const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);

  if (disposition === "Deferred") {
    return "deferred";
  }

  if (isReadyDisposition(disposition) || reviewStatus?.label === "Approved" || reviewStatus?.label === "Overridden") {
    return "ready-for-sponsor-packet";
  }

  if (
    disposition === "NeedsEvidence"
    || reviewStatus?.label === "Rejected"
  ) {
    return "needs-governance";
  }

  return "needs-my-decision";
}

export function classifyGovernanceFindingJobView(row: GovernanceFindingQueueRow): FindingJobView {
  if (row.recordKind !== "finding") {
    return "needs-my-decision";
  }

  const disposition = normalizeDisposition(row.latestDisposition);
  const humanReview = (row.humanReviewStatusLabel ?? "").toLowerCase();

  if (disposition === "Deferred") {
    return "deferred";
  }

  if (isReadyDisposition(disposition) || humanReview.includes("approved") || humanReview.includes("overridden")) {
    return "ready-for-sponsor-packet";
  }

  if (
    disposition === "NeedsEvidence"
    || humanReview.includes("rejected")
    || (isGovernanceOpenRow(row) && disposition.length === 0 && row.severity.toLowerCase() !== "info")
  ) {
    return "needs-governance";
  }

  if (humanReview.includes("pending") || disposition.length === 0) {
    return "needs-my-decision";
  }

  return "needs-my-decision";
}

export function matchesReviewFindingJobView(
  finding: QuickDecisionFinding,
  jobView: FindingJobView,
): boolean {
  return classifyReviewFindingJobView(finding) === jobView;
}

export function matchesGovernanceFindingJobView(
  row: GovernanceFindingQueueRow,
  jobView: FindingJobView,
): boolean {
  return classifyGovernanceFindingJobView(row) === jobView;
}

export function countReviewFindingsForJobView(
  findings: readonly QuickDecisionFinding[],
  jobView: FindingJobView,
): number {
  return findings.filter((finding) => !finding.isMuted && matchesReviewFindingJobView(finding, jobView)).length;
}

export function countGovernanceRowsForJobView(
  rows: readonly GovernanceFindingQueueRow[],
  jobView: FindingJobView,
): number {
  return rows.filter((row) => matchesGovernanceFindingJobView(row, jobView)).length;
}

export function filterReviewFindingsForJobView(
  findings: readonly QuickDecisionFinding[],
  jobView: FindingJobView,
): QuickDecisionFinding[] {
  return findings.filter((finding) => !finding.isMuted && matchesReviewFindingJobView(finding, jobView));
}

export function filterGovernanceRowsForJobView(
  rows: readonly GovernanceFindingQueueRow[],
  jobView: FindingJobView,
): GovernanceFindingQueueRow[] {
  return rows.filter((row) => matchesGovernanceFindingJobView(row, jobView));
}
