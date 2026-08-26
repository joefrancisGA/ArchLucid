import { listOpenRootCauseClusters } from "@/lib/review-quality/compare-quality-delta";
import {
  DEFAULT_FINDING_JOB_VIEW,
  filterReviewFindingsForJobView,
  isReviewFindingDispositionClosed,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import {
  compareFindingsByTrustThenSeverity,
  reviewFindingMatchesProvenanceFilter,
  type FindingGroundingFilter,
  type FindingOriginFilter,
} from "@/lib/findings/finding-trust-triage";
import {
  humanReviewStatusDisplay,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";

export type RunDetailFindingsFilterKind =
  | "all"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "unresolved"
  | "awaiting-decision"
  | "resolved";

export type RunDetailFindingsSortKind =
  | "trust-then-severity"
  | "severity-desc"
  | "severity-asc"
  | "title-asc";

export const FILTER_OPTIONS: readonly { id: RunDetailFindingsFilterKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
  { id: "unresolved", label: "Unresolved" },
  { id: "awaiting-decision", label: "Awaiting decision" },
  { id: "resolved", label: "Resolved" },
];

export const ORIGIN_FILTER_OPTIONS: readonly { id: FindingOriginFilter; label: string }[] = [
  { id: "all", label: "All origins" },
  { id: "Deterministic rule", label: "Deterministic rule" },
  { id: "Deterministic fallback", label: "Deterministic fallback" },
  { id: "AI-generated", label: "AI-generated" },
  { id: "Simulated", label: "Simulated" },
];

export const GROUNDING_FILTER_OPTIONS: readonly { id: FindingGroundingFilter; label: string }[] = [
  { id: "all", label: "All grounding" },
  { id: "Evidence-backed", label: "Evidence-backed" },
  { id: "Estimated", label: "Estimated" },
  { id: "Ungrounded", label: "Ungrounded" },
  { id: "Degraded", label: "Degraded" },
  { id: "Not applicable", label: "Not applicable" },
];

export function countFindingsForToolbarFilter(
  findings: readonly QuickDecisionFinding[],
  filter: RunDetailFindingsFilterKind,
  jobView: FindingJobView = DEFAULT_FINDING_JOB_VIEW,
): number {
  return filterFindingsForToolbar(findings, filter, "", "", "", jobView).length;
}

export function filterFindingsForToolbar(
  findings: readonly QuickDecisionFinding[],
  filter: RunDetailFindingsFilterKind,
  ownerFilter: string,
  domainFilter: string,
  searchQuery: string,
  jobView: FindingJobView = DEFAULT_FINDING_JOB_VIEW,
  originFilter: FindingOriginFilter = "all",
  groundingFilter: FindingGroundingFilter = "all",
): QuickDecisionFinding[] {
  const ownerNeedle = ownerFilter.trim().toLowerCase();
  const domainNeedle = domainFilter.trim().toLowerCase();
  const searchNeedle = searchQuery.trim().toLowerCase();
  const jobScopedFindings = filterReviewFindingsForJobView(findings, jobView);

  return jobScopedFindings.filter((finding) => {
    if (finding.isMuted) {
      return false;
    }

    if (filter === "critical" && (finding.severityValue < 3 || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    if (filter === "high" && (finding.severityValue !== 2 || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    if (filter === "medium" && (finding.severityValue !== 1 || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    if (filter === "low" && (finding.severityValue > 0 || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);

    if (filter === "awaiting-decision" && (reviewStatus?.label !== "Pending review" || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    if (filter === "resolved" && !isReviewFindingDispositionClosed(finding)) {
      return false;
    }

    if (filter === "unresolved" && isReviewFindingDispositionClosed(finding)) {
      return false;
    }

    if (ownerNeedle.length > 0) {
      const owner = (finding.assignedToUserId ?? "").toLowerCase();

      if (!owner.includes(ownerNeedle)) {
        return false;
      }
    }

    if (domainNeedle.length > 0) {
      const domain = (finding.policyRuleId ?? finding.title).toLowerCase();

      if (!domain.includes(domainNeedle)) {
        return false;
      }
    }

    if (searchNeedle.length > 0) {
      const haystack = `${finding.title} ${finding.recommendation}`.toLowerCase();

      if (!haystack.includes(searchNeedle)) {
        return false;
      }
    }

    if (!reviewFindingMatchesProvenanceFilter(finding, originFilter, groundingFilter)) {
      return false;
    }

    return true;
  });
}

export function sortFindingsForToolbar(
  findings: readonly QuickDecisionFinding[],
  sort: RunDetailFindingsSortKind,
): QuickDecisionFinding[] {
  const rows = [...findings];

  rows.sort((a, b) => {
    if (sort === "trust-then-severity") {
      return compareFindingsByTrustThenSeverity(a, b);
    }

    if (sort === "severity-desc") {
      return b.severityValue - a.severityValue || a.findingOrder - b.findingOrder;
    }

    if (sort === "severity-asc") {
      return a.severityValue - b.severityValue || a.findingOrder - b.findingOrder;
    }

    return a.title.localeCompare(b.title);
  });

  return rows;
}

export function deriveFindingsToolbarStatusCounts(findings: readonly QuickDecisionFinding[]): {
  readonly unresolved: number;
  readonly awaitingDecision: number;
  readonly resolved: number;
} {
  let unresolved = 0;
  let awaitingDecision = 0;
  let resolved = 0;

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    const status = humanReviewStatusDisplay(finding.humanReviewStatus);

    if (isReviewFindingDispositionClosed(finding)) {
      resolved += 1;
    } else if (status?.label === "Pending review") {
      awaitingDecision += 1;
    } else {
      unresolved += 1;
    }
  }

  return { unresolved, awaitingDecision, resolved };
}

export function deriveFindingsToolbarSeverityCounts(findings: readonly QuickDecisionFinding[]): {
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
} {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const finding of findings) {
    if (finding.isMuted || isReviewFindingDispositionClosed(finding)) {
      continue;
    }

    if (finding.severityValue >= 3) {
      counts.critical += 1;
    } else if (finding.severityValue === 2) {
      counts.high += 1;
    } else if (finding.severityValue === 1) {
      counts.medium += 1;
    } else {
      counts.low += 1;
    }
  }

  return counts;
}

export function deriveOpenRootCauseClusterCount(findings: readonly QuickDecisionFinding[]): number {
  return listOpenRootCauseClusters(findings).length;
}
