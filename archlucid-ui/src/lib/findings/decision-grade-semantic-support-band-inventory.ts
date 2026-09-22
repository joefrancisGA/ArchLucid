import type { ErrorRecoveryContractGuardedSurface } from "@/lib/error-recovery-contract-inventory";

/** AS-072 shrink-only exception doc — band chip ratchet on Working decision-grade surfaces. */
export const DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARD_DOC_PATH =
  "docs/architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md";

/** AS-061 presentation helper and chip — required on new decision-grade list rows. */
export const DECISION_GRADE_SEMANTIC_SUPPORT_BAND_COMPONENT_MARKERS = [
  "FindingSemanticSupportBandChip",
  "resolveSemanticSupportBandPresentationForFinding",
  "FindingSemanticSupportBandInspectSection",
  "RunDetailReviewPackageSemanticSupportBandSummary",
  "working-finding-semantic-support-band",
] as const;

/** Signals that a file renders decision-grade finding rows in Working chrome. */
export const DECISION_GRADE_SEMANTIC_SUPPORT_BAND_CONTEXT_MARKERS = [
  "isDecisionGradeFinding",
  "FINDING_CLASSIFICATION_DECISION_GRADE",
  "DecisionGradeFinding",
] as const;

/** Heuristic: file maps or renders `QuickDecisionFinding` rows (not stamp-only parents). */
export const DECISION_GRADE_SEMANTIC_SUPPORT_BAND_LIST_ROW_MARKERS = [
  "QuickDecisionFinding",
  "finding: QuickDecisionFinding",
] as const;

/**
 * Canonical Working surfaces that must wire semantic support band (AS-061 / AS-062).
 * New decision-grade list / inspect / stamp roots belong here — not in the grandfather list.
 */
export const DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES: readonly ErrorRecoveryContractGuardedSurface[] =
  [
    {
      id: "working-findings-list-quick-decision-summary-row",
      sourceRoots: ["components/quick-decision-summary/QuickDecisionSummaryFindingRow.tsx"],
      requiredMarkers: ["FindingSemanticSupportBandChip"],
    },
    {
      id: "working-findings-list-dense-table-row",
      sourceRoots: ["components/findings/RunDetailFindingsDenseTableRow.tsx"],
      requiredMarkers: ["FindingSemanticSupportBandChip"],
    },
    {
      id: "working-findings-list-primary-card",
      sourceRoots: ["components/findings/QuickDecisionWorkspacePrimaryFindingCard.tsx"],
      requiredMarkers: ["FindingSemanticSupportBandChip"],
    },
    {
      id: "working-findings-list-secondary-card",
      sourceRoots: ["components/findings/QuickDecisionWorkspaceSecondaryFindingCard.tsx"],
      requiredMarkers: ["FindingSemanticSupportBandChip"],
    },
    {
      id: "working-finding-inspect-body",
      sourceRoots: [
        "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectFindingBody.tsx",
      ],
      requiredMarkers: ["FindingSemanticSupportBandInspectSection"],
    },
    {
      id: "working-review-package-stamp-band",
      sourceRoots: [
        "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageStampViewport.tsx",
      ],
      requiredMarkers: ["RunDetailReviewPackageSemanticSupportBandSummary"],
    },
  ] as const;

/**
 * Shrink-only documented exceptions for decision-grade list rows without a band chip.
 * Do not append paths to silence CI — wire `FindingSemanticSupportBandChip` or remove the row.
 */
export const DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHERED_PATHS: readonly string[] = [];

/** Baseline for shrink ratchet — grandfather count must not grow without admin exception. */
export const DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_COUNT_BASELINE = 0;

export const DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_DOCUMENTED_EXCEPTIONS: readonly string[] =
  [];

/** Roots scanned for new decision-grade list rows that forgot the AS-061 chip. */
export const DECISION_GRADE_SEMANTIC_SUPPORT_BAND_DISCOVERY_ROOTS = [
  "components/quick-decision-summary",
  "components/findings",
  "app/(operator)/architecture/reviews",
] as const;
