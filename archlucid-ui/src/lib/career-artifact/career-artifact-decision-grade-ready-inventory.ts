/**
 * Career artifact surfaces scanned for StatusTag `kind="ready"` on decision-grade without an honesty line (FC-05).
 */
export const CAREER_ARTIFACT_DECISION_GRADE_READY_GUARDED_PATHS = [
  "components/findings/FindingClassificationChip.tsx",
  "components/findings/FindingInsightDensityBand.tsx",
  "components/findings/QuickDecisionWorkspacePrimaryFindingCard.tsx",
  "components/findings/QuickDecisionWorkspaceSecondaryFindingCard.tsx",
  "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageClassificationSummary.tsx",
  "components/reviews/RunDetailCareerArtifactHonestyStrip.tsx",
  "components/use-email-run-to-sponsor-banner.ts",
  "components/EmailRunToSponsorBanner.tsx",
  "components/EmailRunToSponsorExportActions.tsx",
  "components/GoldenManifestExportMenu.tsx",
  "components/GenerateAdrFromRunModal.tsx",
  "app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageClient.tsx",
  "lib/export-markdown.ts",
] as const;

/** Mitigations that prove decision-grade is not rendered as workflow Ready. */
export const CAREER_ARTIFACT_DECISION_GRADE_READY_MITIGATION_MARKERS = [
  "findingClassificationStatusTagKind",
  "densityBandKind",
  "INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE",
  "evaluateCareerArtifactHonesty",
] as const;

/** Labels that indicate decision-grade classification in the same surface. */
export const CAREER_ARTIFACT_DECISION_GRADE_CONTEXT_MARKERS = [
  "Decision-grade",
  "DecisionGradeFinding",
  "decision-grade",
  "FINDING_CLASSIFICATION_DECISION_GRADE",
] as const;

export const CAREER_ARTIFACT_READY_TAG_PATTERNS = [
  'kind="ready"',
  "kind={'ready'}",
  'kind={"ready"}',
] as const;
