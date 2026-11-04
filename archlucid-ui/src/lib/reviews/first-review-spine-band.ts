import { feasibilityVerdictStoredKindLabel, feasibilityVerdictTone } from "@/lib/feasibility-verdict-display";
import { quickDecisionFindingHasRecordedDisposition } from "@/lib/findings/finding-recorded-disposition";
import {
  countFindingsByClassificationBand,
  hasMissingEvidenceReferenceCount,
  isDecisionGradeFinding,
  isUncitedFinding,
} from "@/lib/findings/review-detail-findings-classification-band";
import { countFindingsByTreatmentBand } from "@/lib/review-quality/compare-treatment-band-delta";
import { compareFindingSeverity } from "@/lib/quick-decision-severity-labels";
import { severityBadgeLabel } from "@/lib/quick-decision-severity-labels";
import {
  countDecisionGradeSemanticSupportBandsForPresentation,
  formatStampSemanticSupportBandLineForPresentation,
} from "@/lib/findings/semantic-support-band-stamp";
import {
  shouldPresentSemanticSupportBandAsRehearsal,
} from "@/lib/governance/simulator-career-honesty";
import { formatStructuralExecutionModeLabel } from "@/lib/structural-execution-mode";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

export type FirstReviewSpineBandSummary = {
  readonly gateOutcomeLabel: string;
  readonly gateOutcomeTone: "success" | "warning" | "danger";
  readonly gateOutcomeDetail: string | null;
  readonly executionModeLabel: string | null;
  readonly decisionGradeCount: number;
  readonly checklistCount: number;
  readonly uncitedCount: number;
  readonly evidenceReferenceCountNotStored: boolean;
  readonly topFindingTitle: string | null;
  readonly topFindingRankLabel: string | null;
  readonly topFindingSeverityLabel: string | null;
  readonly semanticSupportLine: string | null;
  readonly showLaneBHonesty: boolean;
  readonly treatmentSummaryLine: string | null;
  readonly recordedDispositionCount: number;
  readonly openDecisionGradeDispositionCount: number;
  readonly showDispositionNextAction: boolean;
  readonly classificationCountsStored: boolean;
  readonly dispositionCountsStored: boolean;
  readonly showTopFindingRow: boolean;
  readonly topFindingId: string | null;
  readonly topFindingPolicyMapped: boolean;
  readonly openGateLabel: string | null;
  readonly openGateHref: string | null;
  readonly openGateReviewTab: FirstReviewOpenGateReviewTab | null;
};

export function countUncitedFindings(findings: readonly QuickDecisionFinding[]): number {
  let uncited = 0;

  for (const finding of findings) {
    if (isUncitedFinding(finding)) {
      uncited += 1;
    }
  }

  return uncited;
}

/** Highest-severity uncited finding for open-gate deep links when the URL is silent. */
export function resolveFirstUncitedFindingId(findings: readonly QuickDecisionFinding[]): string | null {
  const uncited = findings.filter((finding) => isUncitedFinding(finding));

  if (uncited.length === 0) {
    return null;
  }

  const sorted = [...uncited].sort((left, right) =>
    compareFindingSeverity(left.severityValue, right.severityValue),
  );

  return sorted[0]?.findingId ?? null;
}

export function resolveRunDetailVisitDefaultFindingIdWhenUrlSilent(input: {
  readonly findings: readonly QuickDecisionFinding[];
  readonly hasFindingsSnapshot: boolean;
}): string | null {
  if (!input.hasFindingsSnapshot) {
    return null;
  }

  if (countUncitedFindings(input.findings) > 0) {
    return resolveFirstUncitedFindingId(input.findings);
  }

  return resolveFirstOpenDispositionFindingId(input.findings);
}

/** Highest-severity decision-grade finding without a recorded disposition. */
export function resolveFirstOpenDispositionFindingId(
  findings: readonly QuickDecisionFinding[],
): string | null {
  const open = findings.filter(
    (finding) =>
      isDecisionGradeFinding(finding) && !quickDecisionFindingHasRecordedDisposition(finding),
  );

  if (open.length === 0) {
    return null;
  }

  const sorted = [...open].sort((left, right) =>
    compareFindingSeverity(left.severityValue, right.severityValue),
  );

  return sorted[0]?.findingId ?? null;
}

function resolveTopDecisionGradeFinding(
  findings: readonly QuickDecisionFinding[],
): QuickDecisionFinding | null {
  const decisionGradeFindings = findings.filter((finding) => isDecisionGradeFinding(finding));

  if (decisionGradeFindings.length === 0) {
    return null;
  }

  return [...decisionGradeFindings].sort((left, right) => compareFindingSeverity(left.severityValue, right.severityValue))[0] ?? null;
}

export function countDispositionStats(findings: readonly QuickDecisionFinding[]): {
  readonly recordedCount: number;
  readonly openDecisionGradeCount: number;
} {
  let recordedCount = 0;
  let openDecisionGradeCount = 0;

  for (const finding of findings) {
    if (quickDecisionFindingHasRecordedDisposition(finding)) {
      recordedCount += 1;

      continue;
    }

    if (isDecisionGradeFinding(finding)) {
      openDecisionGradeCount += 1;
    }
  }

  return { recordedCount, openDecisionGradeCount };
}

function formatTreatmentSummaryLine(
  counts: ReturnType<typeof countFindingsByTreatmentBand>,
): string | null {
  const total = counts.decisionGrade + counts.checklist + counts.demotedToChecklist;

  if (total === 0) {
    return null;
  }

  const segments = [
    `Decision-grade: ${counts.decisionGrade}`,
    `Checklist: ${counts.checklist}`,
  ];

  if (counts.demotedToChecklist > 0) {
    segments.push(`Demoted: ${counts.demotedToChecklist}`);
  }

  return segments.join(" · ");
}

const TOP_FINDING_TITLE_NOT_STORED = "Top finding title was not stored.";
const TOP_FINDING_TITLE_STORED_EMPTY = "Top finding title was stored empty.";

function resolveTopFindingTitleForSpine(finding: QuickDecisionFinding): string {
  const title = finding.title;

  if (title === null || title === undefined) {
    return TOP_FINDING_TITLE_NOT_STORED;
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return TOP_FINDING_TITLE_STORED_EMPTY;
  }

  return trimmed;
}

/** Compact first-viewport spine: gate outcome, execution mode, classification counts, top finding. */
export const FIRST_REVIEW_SPINE_FINDINGS_SNAPSHOT_NOT_STORED =
  "Findings snapshot was not stored — classification counts are withheld." as const;

export const FIRST_REVIEW_SPINE_CLASSIFICATION_COUNTS_NOT_STORED =
  "Classification counts were not stored." as const;

export const FIRST_REVIEW_SPINE_DISPOSITIONS_NOT_STORED = "Dispositions were not stored." as const;

export const FIRST_REVIEW_SPINE_OPEN_GATE_NOT_STORED = "Open gate was not stored." as const;

export const FIRST_REVIEW_SPINE_NO_OPEN_GATE_EVIDENCE_REF_NOT_STORED =
  "Evidence reference count was not stored. This spine does not call the gate clear." as const;

export const FIRST_REVIEW_SPINE_NO_OPEN_GATE_CLEAR_LINE =
  "No uncited finding or open decision-grade disposition is stored, and a committed package is stored. This is not an approval to build." as const;

export type FirstReviewOpenGateReviewTab = "findings" | "review-package";

export function resolveFirstReviewOpenGate(input: {
  readonly uncitedCount: number;
  readonly openDecisionGradeDispositionCount: number;
  readonly reviewHasGoldenManifest: boolean;
}): { readonly label: string | null; readonly reviewTab: FirstReviewOpenGateReviewTab | null } {
  if (input.uncitedCount > 0) {
    return { label: "Uncited finding", reviewTab: "findings" };
  }

  if (input.openDecisionGradeDispositionCount > 0) {
    return { label: "Open disposition", reviewTab: "findings" };
  }

  if (!input.reviewHasGoldenManifest) {
    return { label: "Uncommitted review", reviewTab: "review-package" };
  }

  return { label: null, reviewTab: null };
}

export function resolveRunDetailVisitDefaultReviewTab(input: {
  readonly findings: readonly QuickDecisionFinding[];
  readonly hasFindingsSnapshot: boolean;
  readonly reviewHasGoldenManifest: boolean;
}): ReviewDetailTabId | null {
  if (!input.hasFindingsSnapshot) {
    return null;
  }

  const uncitedCount = countUncitedFindings(input.findings);
  const dispositionStats = countDispositionStats(input.findings);
  const openGate = resolveFirstReviewOpenGate({
    uncitedCount,
    openDecisionGradeDispositionCount: dispositionStats.openDecisionGradeCount,
    reviewHasGoldenManifest: input.reviewHasGoldenManifest,
  });

  return openGate.reviewTab;
}

export const FIRST_REVIEW_SPINE_OPEN_GATE_SECTION_ID_PREFIX = "run-detail-first-review-spine-" as const;

export function resolveFirstReviewSpineOpenGateSectionId(
  reviewTab: FirstReviewOpenGateReviewTab | null,
): string | null {
  if (reviewTab === null) {
    return null;
  }

  return `${FIRST_REVIEW_SPINE_OPEN_GATE_SECTION_ID_PREFIX}${reviewTab}`;
}

/** Scroll target for silent URL open gate when the review package tab is the first action. */
export function resolveRunDetailVisitDefaultReviewHashWhenUrlSilent(input: {
  readonly findings: readonly QuickDecisionFinding[];
  readonly hasFindingsSnapshot: boolean;
  readonly reviewHasGoldenManifest: boolean;
}): string | null {
  const defaultTab = resolveRunDetailVisitDefaultReviewTab(input);

  if (defaultTab === "review-package") {
    return resolveFirstReviewSpineOpenGateSectionId("review-package");
  }

  return null;
}

export function deriveFirstReviewSpineBandSummary(input: {
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly structuralExecutionMode: StructuralExecutionModeInput;
  readonly findings: readonly QuickDecisionFinding[];
  readonly hasFindingsSnapshot?: boolean;
  readonly reviewHasGoldenManifest?: boolean;
}): FirstReviewSpineBandSummary | null {
  if (input.hasFindingsSnapshot === false) {
    const feasibilityVerdict = input.feasibilityVerdict ?? null;

    return {
      gateOutcomeLabel:
        feasibilityVerdict !== null ? feasibilityVerdictStoredKindLabel(feasibilityVerdict.kind) : "Gate outcome was not stored",
      gateOutcomeTone: feasibilityVerdict !== null ? feasibilityVerdictTone(feasibilityVerdict.kind) : "warning",
      gateOutcomeDetail: FIRST_REVIEW_SPINE_FINDINGS_SNAPSHOT_NOT_STORED,
      executionModeLabel:
        input.structuralExecutionMode === null || input.structuralExecutionMode === undefined
          ? "Execution mode was not stored"
          : formatStructuralExecutionModeLabel(input.structuralExecutionMode),
      decisionGradeCount: 0,
      checklistCount: 0,
      uncitedCount: 0,
      evidenceReferenceCountNotStored: true,
      topFindingTitle: null,
      topFindingRankLabel: null,
      topFindingId: null,
      showTopFindingRow: false,
      topFindingPolicyMapped: false,
      openGateLabel: FIRST_REVIEW_SPINE_OPEN_GATE_NOT_STORED,
      openGateHref: null,
      openGateReviewTab: null,
      topFindingSeverityLabel: null,
      semanticSupportLine: null,
      showLaneBHonesty: false,
      treatmentSummaryLine: null,
      recordedDispositionCount: 0,
      openDecisionGradeDispositionCount: 0,
      showDispositionNextAction: false,
      classificationCountsStored: false,
      dispositionCountsStored: false,
    };
  }

  const findings = input.findings;
  const classificationCounts = countFindingsByClassificationBand(findings);
  const uncitedCount = countUncitedFindings(findings);
  const evidenceReferenceCountNotStored = hasMissingEvidenceReferenceCount(findings);
  const topFinding = resolveTopDecisionGradeFinding(findings);
  const feasibilityVerdict = input.feasibilityVerdict ?? null;

  if (
    feasibilityVerdict === null
    && classificationCounts.decisionGrade + classificationCounts.checklist === 0
    && topFinding === null
  ) {
    return null;
  }

  const gateOutcomeLabel =
    feasibilityVerdict !== null ? feasibilityVerdictStoredKindLabel(feasibilityVerdict.kind) : "Gate outcome was not stored";
  const gateOutcomeTone =
    feasibilityVerdict !== null ? feasibilityVerdictTone(feasibilityVerdict.kind) : "warning";
  const gateOutcomeDetail =
    feasibilityVerdict === null
      ? null
      : feasibilityVerdict.summary === null || feasibilityVerdict.summary === undefined
        ? "Verdict summary was not stored."
        : feasibilityVerdict.summary.trim().length > 0
          ? feasibilityVerdict.summary.trim()
          : "Verdict summary was stored empty.";
  const executionModeLabel =
    input.structuralExecutionMode === null || input.structuralExecutionMode === undefined
      ? "Execution mode was not stored"
      : formatStructuralExecutionModeLabel(input.structuralExecutionMode);
  const semanticSupportCounts = countDecisionGradeSemanticSupportBandsForPresentation(
    findings,
    input.structuralExecutionMode,
  );
  const semanticSupportLine = formatStampSemanticSupportBandLineForPresentation(
    semanticSupportCounts,
    input.structuralExecutionMode,
  );
  const showLaneBHonesty =
    !shouldPresentSemanticSupportBandAsRehearsal(input.structuralExecutionMode)
    && semanticSupportCounts.unchecked > 0;
  const treatmentCounts = countFindingsByTreatmentBand(findings);
  const treatmentSummaryLine = formatTreatmentSummaryLine(treatmentCounts);
  const dispositionStats = countDispositionStats(findings);
  const openGate = resolveFirstReviewOpenGate({
    uncitedCount,
    openDecisionGradeDispositionCount: dispositionStats.openDecisionGradeCount,
    reviewHasGoldenManifest: input.reviewHasGoldenManifest === true,
  });

  return {
    gateOutcomeLabel,
    gateOutcomeTone,
    gateOutcomeDetail,
    executionModeLabel,
    decisionGradeCount: classificationCounts.decisionGrade,
    checklistCount: classificationCounts.checklist,
    uncitedCount,
    evidenceReferenceCountNotStored,
    topFindingTitle: topFinding === null ? null : resolveTopFindingTitleForSpine(topFinding),
    topFindingId: topFinding?.findingId ?? null,
    showTopFindingRow: topFinding !== null,
    topFindingPolicyMapped: topFinding?.policyRuleId !== null && topFinding?.policyRuleId !== undefined,
    topFindingRankLabel:
      topFinding === null
        ? null
        : topFinding.severityValue !== null && topFinding.severityValue !== undefined
          ? "Highest stored severity:"
          : "Decision-grade finding:",
    topFindingSeverityLabel:
      topFinding !== null ? severityBadgeLabel(topFinding.severityValue) : null,
    semanticSupportLine,
    showLaneBHonesty,
    treatmentSummaryLine,
    recordedDispositionCount: dispositionStats.recordedCount,
    openDecisionGradeDispositionCount: dispositionStats.openDecisionGradeCount,
    showDispositionNextAction: dispositionStats.openDecisionGradeCount > 0,
    classificationCountsStored: true,
    dispositionCountsStored: true,
    openGateLabel: openGate.label,
    openGateHref: openGate.reviewTab === null ? null : `#run-detail-first-review-spine-${openGate.reviewTab}`,
    openGateReviewTab: openGate.reviewTab,
  };
}
