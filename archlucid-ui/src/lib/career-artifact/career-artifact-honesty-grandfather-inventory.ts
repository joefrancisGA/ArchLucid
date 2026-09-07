/**
 * Paths exempt from calling `evaluateCareerArtifactHonesty()` until migrated.
 * FC-07: every entry MUST have a matching `FC-0078-WAIVER` comment in this file — the ratchet guard fails otherwise.
 */
export const CAREER_ARTIFACT_HONESTY_GRANDFATHER_WAIVER_MARKER = "FC-0078-WAIVER" as const;

/** FC-0078-WAIVER: export formatters still compose coverage-honesty header helpers directly; migrate to evaluateCareerArtifactHonesty in FC-09+. */
export const CAREER_EXPORT_FORMATTER_GRANDFATHERED_PATHS = [
  "components/GoldenManifestExportMenu.tsx",
  "components/GenerateAdrFromRunModal.tsx",
  "app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageClient.tsx",
  "lib/export-markdown.ts",
] as const;

export const CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS = [
  ...CAREER_EXPORT_FORMATTER_GRANDFATHERED_PATHS,
] as const;
