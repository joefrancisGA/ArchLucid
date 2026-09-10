/**
 * Export formatters that emit career artifact bytes (markdown, print, ADR, manifest JSON).
 * FC-06: must import evaluateCareerArtifactHonesty() unless grandfathered (FC-07).
 */
export const CAREER_EXPORT_FORMATTER_PATHS = [
  "components/GoldenManifestExportMenu.tsx",
  "components/GenerateAdrFromRunModal.tsx",
  "app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageClient.tsx",
  "lib/export-markdown.ts",
  "lib/sealed-manifest-json-export.ts",
] as const;

/**
 * UI surfaces that evaluate ADR 0078 before stamp, finalize posture, or sponsor send (FC-02).
 */
export const CAREER_ARTIFACT_HONESTY_UI_SURFACES = [
  "components/reviews/RunDetailCareerArtifactHonestyStrip.tsx",
  "components/use-email-run-to-sponsor-banner.ts",
] as const;

/** Union inventory registered with guarded-path-inventories (FC-04). */
export const CAREER_EXPORT_MOUNTED_UI_PATHS = [
  ...CAREER_EXPORT_FORMATTER_PATHS,
  ...CAREER_ARTIFACT_HONESTY_UI_SURFACES,
] as const;

/** Legacy alias — export formatters use coverage-honesty header helpers. */
export const CAREER_EXPORT_HONESTY_MODULE_IMPORT = "@/lib/career-export-coverage-honesty";

export const CAREER_EXPORT_HONESTY_REQUIRED_SYMBOLS = [
  "formatCareerExportHonestyMarkdown",
  "formatCareerExportHonestyPlainText",
  "resolveCareerExportBlockedReason",
  "resolveCareerExportCoverageHonesty",
] as const;

/** ADR 0078 single entry point (FC-02 / FC-06). */
export const CAREER_ARTIFACT_HONESTY_MODULE_IMPORT = "@/lib/career-artifact/career-artifact-honesty";

export const CAREER_ARTIFACT_COMPLETENESS_MODULE_IMPORT = CAREER_ARTIFACT_HONESTY_MODULE_IMPORT;

export const CAREER_ARTIFACT_COMPLETENESS_SYMBOL = "evaluateCareerArtifactHonesty";

export const CAREER_ARTIFACT_HONESTY_REQUIRED_SYMBOLS = [CAREER_ARTIFACT_COMPLETENESS_SYMBOL] as const;
