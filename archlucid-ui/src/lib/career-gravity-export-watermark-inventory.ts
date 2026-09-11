import { CAREER_EXPORT_MOUNTED_UI_PATHS } from "@/lib/career-export-mounted-ui-paths";

/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_EXPORT_WATERMARK_INVENTORY_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_EXPORT_WATERMARK_INVENTORY.md" as const;

export type CareerGravityExportWatermarkLeakClass =
  | "covered"
  | "assumed-banner"
  | "bypass"
  | "eval-ok"
  | "related";

export type CareerGravityExportWatermarkRow = {
  readonly relativePath: string;
  readonly leakClass: CareerGravityExportWatermarkLeakClass;
  readonly ownerPrompt: string;
};

/**
 * Mapper gravity gap (CG-003): banner flag inferred from structural Mode.
 * Do not treat this as proof bytes are watermarked. CG-022+ must change the mapper.
 */
export const CAREER_GRAVITY_EXPORT_MAPPER_PATH =
  "ArchLucid.Application/Exports/CareerArtifactCompletenessInputMapper.cs" as const;

export const CAREER_GRAVITY_EXPORT_WATERMARK_ROWS: readonly CareerGravityExportWatermarkRow[] = [
  {
    relativePath: "archlucid-ui/src/components/GoldenManifestExportMenu.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-022",
  },
  {
    relativePath: "archlucid-ui/src/components/GenerateAdrFromRunModal.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-024",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageClient.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-023",
  },
  {
    relativePath: "archlucid-ui/src/lib/export-markdown.ts",
    leakClass: "covered",
    ownerPrompt: "CG-022",
  },
  {
    relativePath: "archlucid-ui/src/lib/sealed-manifest-json-export.ts",
    leakClass: "covered",
    ownerPrompt: "CG-044",
  },
  {
    relativePath: "archlucid-ui/src/components/reviews/RunDetailCareerArtifactHonestyStrip.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-029",
  },
  {
    relativePath: "archlucid-ui/src/components/use-email-run-to-sponsor-banner.ts",
    leakClass: "covered",
    ownerPrompt: "CG-029",
  },
  {
    relativePath: "archlucid-ui/src/lib/career-export-demo-chrome.ts",
    leakClass: "eval-ok",
    ownerPrompt: "CG-003",
  },
  {
    relativePath: "archlucid-ui/src/lib/governance/simulator-career-honesty.ts",
    leakClass: "eval-ok",
    ownerPrompt: "CG-003",
  },
  {
    relativePath: "archlucid-ui/src/lib/career-rehearsal-help-guide-content.ts",
    leakClass: "eval-ok",
    ownerPrompt: "CG-003",
  },
  {
    relativePath: CAREER_GRAVITY_EXPORT_MAPPER_PATH,
    leakClass: "assumed-banner",
    ownerPrompt: "CG-022",
  },
  {
    relativePath: "ArchLucid.Application/Exports/CareerArtifactExportCompletenessGate.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-022",
  },
  {
    relativePath: "ArchLucid.Application/Exports/SponsorReviewPacketBuilder.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-022",
  },
  {
    relativePath: "ArchLucid.Application/Exports/RunSummaryOnePagerExportService.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-022",
  },
  {
    relativePath: "ArchLucid.Application/Exports/ArchitectureReviewExportService.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-022",
  },
  {
    relativePath: "ArchLucid.Application/Analysis/ExportReplayService.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-027",
  },
  {
    relativePath: "ArchLucid.Api/Controllers/Authority/DocxExportController.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-043",
  },
  {
    relativePath: "ArchLucid.Application/Exports/DecisionReceiptService.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-025",
  },
  {
    relativePath: "ArchLucid.Application/Pilots/FirstValueReportBuilder.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-022",
  },
  {
    relativePath: "ArchLucid.Application/Pilots/FirstValueReportPdfBuilder.cs",
    leakClass: "eval-ok",
    ownerPrompt: "CG-042",
  },
  {
    relativePath:
      "ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs",
    leakClass: "covered",
    ownerPrompt: "CG-021",
  },
  {
    relativePath: "ArchLucid.Api/Controllers/Authority/ArtifactExportController.Export.Download.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-028",
  },
  {
    relativePath: "ArchLucid.Api/Controllers/Authority/ArtifactExportController.Export.Push.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-028",
  },
  {
    relativePath: "ArchLucid.Api/Controllers/Admin/AuditController.Export.Csv.cs",
    leakClass: "related",
    ownerPrompt: "CG-026",
  },
  {
    relativePath: "ArchLucid.Api/Controllers/Findings/FindingVerificationController.Export.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-026",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/PilotProofPacketStructuralExecutionModeFormatter.cs",
    leakClass: "covered",
    ownerPrompt: "CG-045",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/FirstValueReportCommand.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-027",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/ProofPacketCommand.cs",
    leakClass: "assumed-banner",
    ownerPrompt: "CG-027",
  },
] as const;

/** Shrink-only: mounted FC UI honesty paths must stay listed (posix, relative to archlucid-ui/src). */
export const CAREER_GRAVITY_EXPORT_MOUNTED_UI_SRC_PATHS: readonly string[] = CAREER_EXPORT_MOUNTED_UI_PATHS;
