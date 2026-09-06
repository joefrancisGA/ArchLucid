/**
 * Working-mode career export surfaces that must mount shared PC-13 honesty (PC-01 floor + quiet engines).
 * Guard test fails if a listed module stops importing `career-export-coverage-honesty`.
 */
export const CAREER_EXPORT_MOUNTED_UI_PATHS = [
  "components/GoldenManifestExportMenu.tsx",
  "components/GenerateAdrFromRunModal.tsx",
  "app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageClient.tsx",
  "lib/export-markdown.ts",
] as const;

/** Symbols each mounted export path must reference from the shared honesty module. */
export const CAREER_EXPORT_HONESTY_MODULE_IMPORT = "@/lib/career-export-coverage-honesty";

export const CAREER_EXPORT_HONESTY_REQUIRED_SYMBOLS = [
  "formatCareerExportHonestyMarkdown",
  "formatCareerExportHonestyPlainText",
  "resolveCareerExportBlockedReason",
  "resolveCareerExportCoverageHonesty",
] as const;
