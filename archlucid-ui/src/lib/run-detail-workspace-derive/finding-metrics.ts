import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { deriveRunListPipelineLabel } from "@/components/RunStatusBadge";
import { governanceGateLabelFromManifestStatus } from "@/lib/governance/governance-gate-display";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { shouldShowRunDetailGovernanceCta } from "@/lib/runs/run-detail-governance-cta-visibility";
import {
  humanReviewStatusDisplay,
  severityBadgeLabel,
  sortQuickDecisionFindings,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { evidenceAbsenceFindingLabel } from "@/lib/evidence-absence-finding-copy";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { isGeneratedIntakeBrief, toReviewDisplayTitle } from "@/lib/review-display-title";
import {
  isQualityRejectedRunStatus,
  resolveExecutionFailedWorkspaceStatusLabel,
  resolveQualityRejectedWorkspaceStatusLabel,
} from "@/lib/execution-vs-quality-outcome-copy";
import type { ManifestSummary, RunDetail, RunSummary } from "@/types/authority";

const PRODUCT_BRAND_NAME = "ArchLucid";

import {
  isFindingResolved
} from "./internal";
import type {
  FindingSeverityCounts
} from "./types";
export function countFindingsBySeverity(findings: readonly QuickDecisionFinding[]): FindingSeverityCounts {
  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    if (finding.severityValue >= 3) {
      critical += 1;
    } else if (finding.severityValue === 2) {
      high += 1;
    } else if (finding.severityValue === 1) {
      medium += 1;
    } else {
      low += 1;
    }
  }

  return { critical, high, medium, low };
}
export function deriveHighestFindingSeverityLabel(
  findings: readonly QuickDecisionFinding[],
  fallback: string | null,
): string | null {
  const counts = countFindingsBySeverity(findings);
  const total = counts.critical + counts.high + counts.medium + counts.low;

  if (total === 0) {
    return fallback;
  }

  if (counts.critical > 0) {
    return "Critical";
  }

  if (counts.high > 0) {
    return "High";
  }

  if (counts.medium > 0) {
    return "Medium";
  }

  return "Low";
}
export function filterUnresolvedFindings(
  findings: readonly QuickDecisionFinding[],
): QuickDecisionFinding[] {
  return findings.filter((finding) => !finding.isMuted && !isFindingResolved(finding));
}
export function countOpenFindings(findings: readonly QuickDecisionFinding[]): number {
  return filterUnresolvedFindings(findings).length;
}
export function deriveHighestUnresolvedSeverityLabel(
  findings: readonly QuickDecisionFinding[],
): string | null {
  return deriveHighestFindingSeverityLabel(filterUnresolvedFindings(findings), null);
}
export function derivePrimaryConcernFinding(
  findings: readonly QuickDecisionFinding[],
): QuickDecisionFinding | null {
  const unresolved = filterUnresolvedFindings(findings);

  if (unresolved.length === 0) {
    return null;
  }

  const sorted = sortQuickDecisionFindings(unresolved);

  return sorted[0] ?? null;
}
export function derivePrimaryConcernLabel(findings: readonly QuickDecisionFinding[]): string | null {
  const title = derivePrimaryConcernFinding(findings)?.title ?? null;

  if (title === null) {
    return null;
  }

  return evidenceAbsenceFindingLabel(title);
}
export function countFindingsAwaitingAction(findings: readonly QuickDecisionFinding[]): number {
  return findings.filter((finding) => {
    if (finding.isMuted) {
      return false;
    }

    const status = humanReviewStatusDisplay(finding.humanReviewStatus);

    if (status?.label === "Pending review" || status?.label === "Rejected") {
      return true;
    }

    return finding.severityValue >= 2;
  }).length;
}
export function severityLabelForFinding(finding: QuickDecisionFinding): string {
  return severityBadgeLabel(finding.severityValue);
}
