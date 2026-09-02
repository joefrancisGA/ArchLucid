export const ARCHITECTURE_REVIEW_BOARD_EXPORT_SECTION_KINDS = [
  "sponsorReport",
  "systemOverview",
  "evidenceReviewed",
  "architectureDecisions",
  "keyRisks",
  "policyFindings",
  "aiAssistedAnalysis",
  "traceabilityAppendix",
  "recommendedNextActions",
] as const;

export type ArchitectureReviewBoardExportSectionKindUi =
  (typeof ARCHITECTURE_REVIEW_BOARD_EXPORT_SECTION_KINDS)[number];

/** Canonical sponsor-export body headings (mirrors server catalog). */
export const ARCHITECTURE_REVIEW_BOARD_EXPORT_SECTION_HEADINGS = [
  "Sponsor report",
  "System overview (architecture snapshot)",
  "Evidence reviewed",
  "Architecture decisions",
  "Key risks",
  "Policy findings",
  "AI-assisted analysis",
  "Traceability appendix",
  "Recommended next actions",
] as const;
