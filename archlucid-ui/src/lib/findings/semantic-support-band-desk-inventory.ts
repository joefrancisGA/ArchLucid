/**
 * AS-072: Working decision-grade surfaces that must render FindingSemanticSupportBandChip
 * (or an approved wrapper) beside provenance. Shrink-only — migrate surfaces onto the chip helper
 * before removing rows.
 */
export const SEMANTIC_SUPPORT_BAND_DESK_GUARDED_PATHS = [
  "components/findings/RunDetailFindingsDenseTableRow.tsx",
  "components/findings/QuickDecisionWorkspacePrimaryFindingCard.tsx",
  "components/findings/QuickDecisionWorkspaceSecondaryFindingCard.tsx",
  "components/findings/FindingSemanticSupportBandInspectSection.tsx",
  "components/quick-decision-summary/QuickDecisionSummaryFindingRow.tsx",
  "app/(operator)/governance/findings/GovernanceFindingsQueueOperationalRowCells.tsx",
] as const;

/** Approved import or JSX usage markers for the band chip helper. */
export const SEMANTIC_SUPPORT_BAND_DESK_CHIP_MARKERS = [
  "FindingSemanticSupportBandChip",
  "presentDecisionGradeSemanticSupportBand",
] as const;

/** Decision-grade context markers — surfaces with these must also show the band chip. */
export const SEMANTIC_SUPPORT_BAND_DECISION_GRADE_CONTEXT_MARKERS = [
  "Decision-grade",
  "DecisionGradeFinding",
  "decision-grade",
  "FINDING_CLASSIFICATION_DECISION_GRADE",
  "working-finding-semantic-support-band",
] as const;

export const SEMANTIC_SUPPORT_BAND_DESK_GUARD_BASELINE_COUNT =
  SEMANTIC_SUPPORT_BAND_DESK_GUARDED_PATHS.length;
