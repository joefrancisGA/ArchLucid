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

export const RUN_DETAIL_DECISION_DELTA_EMPTY_MESSAGE =
  "No open finding titles are listed on this card — the sealed decision count is not repeated here.";

export type RunDetailDecisionDeltaRow = {
  readonly rank: number;
  readonly findingId: string;
  readonly title: string;
  readonly severityLabel: string;
  readonly policyRuleId: string | null;
  readonly evidenceRefCount: number | null;
  readonly evidenceAnchorHint: string | null;
  readonly evidenceRefCountNotStored: boolean;
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

  if (count === null || count === undefined) {
    return null;
  }

  if (typeof count === "number" && Number.isFinite(count) && count > 0) {
    return `${count} evidence reference${count === 1 ? "" : "s"} on finding record`;
  }

  if (count === 0) {
    return "Evidence references were stored as zero.";
  }

  return "Evidence anchor was not stored.";
}

const DECISION_DELTA_TITLE_NOT_STORED = "Finding title was not stored." as const;
const DECISION_DELTA_TITLE_STORED_EMPTY = "Finding title was stored empty." as const;

function resolveDecisionDeltaTitle(finding: QuickDecisionFinding): string {
  const title = finding.title;

  if (title === null || title === undefined) {
    return DECISION_DELTA_TITLE_NOT_STORED;
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return DECISION_DELTA_TITLE_STORED_EMPTY;
  }

  return truncateDecisionDeltaMessage(trimmed);
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

  const evidenceAnchorHint = resolveEvidenceAnchorHint(finding);

  return {
    rank,
    findingId: finding.findingId,
    title: resolveDecisionDeltaTitle(finding),
    severityLabel: severityBadgeLabel(finding.severityValue),
    policyRuleId,
    evidenceRefCount:
      typeof finding.evidenceRefCount === "number" && Number.isFinite(finding.evidenceRefCount)
        ? Math.trunc(finding.evidenceRefCount)
        : null,
    evidenceAnchorHint,
    evidenceRefCountNotStored:
      finding.evidenceRefCount === null || finding.evidenceRefCount === undefined,
    trustChipSet: trustPresentation.chipSet,
    compareDeltaTrustLabels: formatFindingTrustCompareDeltaLabels(trustPresentation.chipSet),
  };
}

export const RUN_DETAIL_DECISION_DELTA_FINDINGS_SNAPSHOT_NOT_STORED =
  "Findings snapshot was not stored — decision delta is withheld until findings are captured." as const;

export function resolveRunDetailDecisionDeltaView(
  findings: readonly QuickDecisionFinding[],
  isCommitted: boolean,
  hasFindingsSnapshot: boolean | undefined = true,
): RunDetailDecisionDeltaView | null {
  if (!isCommitted) {
    return null;
  }

  if (hasFindingsSnapshot !== true) {
    return {
      isCommitted: true,
      rows: [],
      emptyMessage: RUN_DETAIL_DECISION_DELTA_FINDINGS_SNAPSHOT_NOT_STORED,
    };
  }

  const material = selectMaterialDecisionDeltaFindings(findings);

  if (material.length === 0) {
    return {
      isCommitted: true,
      rows: [],
      emptyMessage: RUN_DETAIL_DECISION_DELTA_EMPTY_MESSAGE,
    };
  }

  const rows = material.map((finding, index) => buildRunDetailDecisionDeltaRow(finding, index + 1));

  return {
    isCommitted: true,
    rows,
    emptyMessage: null,
  };
}
