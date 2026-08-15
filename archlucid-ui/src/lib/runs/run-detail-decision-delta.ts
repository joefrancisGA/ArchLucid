import {
  deriveFindingTrustPresentation,
  formatFindingTrustCompareDeltaLabels,
  type FindingTrustChipSet,
} from "@/lib/findings/finding-trust-presentation";
import { isReviewFindingDispositionClosed } from "@/lib/findings/finding-job-view";
import {
  severityBadgeLabel,
  sortQuickDecisionFindings,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";

/** Assessment Tier 2 #8 — top material findings surfaced on committed review detail. */
export const RUN_DETAIL_DECISION_DELTA_TOP_N = 3;

export const RUN_DETAIL_DECISION_DELTA_MESSAGE_TRUNCATE = 180;

export type RunDetailDecisionDeltaRow = {
  readonly rank: number;
  readonly findingId: string;
  readonly title: string;
  readonly severityLabel: string;
  readonly policyRuleId: string | null;
  readonly evidenceRefCount: number | null;
  readonly evidenceAnchorHint: string | null;
  readonly trustChipSet: FindingTrustChipSet;
  readonly compareDeltaTrustLabels: { readonly origin: string; readonly grounding: string };
};

export type RunDetailDecisionDeltaView = {
  readonly isCommitted: boolean;
  readonly rows: readonly RunDetailDecisionDeltaRow[];
  readonly emptyMessage: string | null;
};

export function truncateDecisionDeltaMessage(message: string, maxLength = RUN_DETAIL_DECISION_DELTA_MESSAGE_TRUNCATE): string {
  const trimmed = message.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function selectMaterialDecisionDeltaFindings(
  findings: readonly QuickDecisionFinding[],
  limit = RUN_DETAIL_DECISION_DELTA_TOP_N,
): QuickDecisionFinding[] {
  const active = findings.filter(
    (finding) => !finding.isMuted && !isReviewFindingDispositionClosed(finding),
  );

  return sortQuickDecisionFindings(active).slice(0, Math.max(0, limit));
}

function resolveEvidenceAnchorHint(finding: QuickDecisionFinding): string | null {
  const snippets = finding.evidenceRefSnippets;

  if (snippets !== undefined && snippets.length > 0) {
    const first = snippets[0]?.trim();

    if (first !== undefined && first.length > 0) {
      return truncateDecisionDeltaMessage(first, 120);
    }
  }

  const count = finding.evidenceRefCount;

  if (typeof count === "number" && Number.isFinite(count) && count > 0) {
    return `${count} evidence reference${count === 1 ? "" : "s"} on finding record`;
  }

  return null;
}

export function buildRunDetailDecisionDeltaRow(
  finding: QuickDecisionFinding,
  rank: number,
): RunDetailDecisionDeltaRow {
  const policyRuleIdRaw = finding.policyRuleId?.trim() ?? "";
  const policyRuleId = policyRuleIdRaw.length > 0 ? policyRuleIdRaw : null;
  const trustPresentation = deriveFindingTrustPresentation({
    trustLabel: finding.trustLabel,
    trustLabelReason: finding.trustLabelReason,
    policyRuleId: finding.policyRuleId,
    evidenceRefCount: finding.evidenceRefCount,
    confidenceLevel: finding.confidenceLevel,
  });

  return {
    rank,
    findingId: finding.findingId,
    title: truncateDecisionDeltaMessage(finding.title),
    severityLabel: severityBadgeLabel(finding.severityValue),
    policyRuleId,
    evidenceRefCount:
      typeof finding.evidenceRefCount === "number" && Number.isFinite(finding.evidenceRefCount)
        ? Math.trunc(finding.evidenceRefCount)
        : null,
    evidenceAnchorHint: resolveEvidenceAnchorHint(finding),
    trustChipSet: trustPresentation.chipSet,
    compareDeltaTrustLabels: formatFindingTrustCompareDeltaLabels(trustPresentation.chipSet),
  };
}

export function resolveRunDetailDecisionDeltaView(
  findings: readonly QuickDecisionFinding[],
  isCommitted: boolean,
): RunDetailDecisionDeltaView | null {
  if (!isCommitted) {
    return null;
  }

  const material = selectMaterialDecisionDeltaFindings(findings);

  if (material.length === 0) {
    return {
      isCommitted: true,
      rows: [],
      emptyMessage:
        "No active findings recorded — ArchLucid did not surface a material recommended change in this review.",
    };
  }

  const rows = material.map((finding, index) => buildRunDetailDecisionDeltaRow(finding, index + 1));

  return {
    isCommitted: true,
    rows,
    emptyMessage: null,
  };
}
