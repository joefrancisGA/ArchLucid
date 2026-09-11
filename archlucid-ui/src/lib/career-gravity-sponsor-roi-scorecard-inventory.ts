/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_INVENTORY_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_INVENTORY.md" as const;

export type CareerGravitySponsorRoiLeakClass = "covered" | "bypass" | "related" | "eval-ok";

export type CareerGravitySponsorRoiRow = {
  readonly relativePath: string;
  readonly leakClass: CareerGravitySponsorRoiLeakClass;
  readonly ownerPrompt: string;
};

export const CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_ROWS: readonly CareerGravitySponsorRoiRow[] = [
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/sponsor-report/page.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-035",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/roi-summary/_sections/RoiSummaryBuyerChrome.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-035",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardPageView.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-034",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardRoiPanel.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-034",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardPrimaryOutcomes.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-034",
  },
  {
    relativePath: "ArchLucid.Application/Roi/SponsorRoiSummaryService.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-035",
  },
  {
    relativePath: "ArchLucid.Application/Roi/SponsorRoiHistoryRunModeCalculator.cs",
    leakClass: "related",
    ownerPrompt: "CG-035",
  },
  {
    relativePath: "ArchLucid.Application/Runs/StructuralExecutionModeHonesty.cs",
    leakClass: "related",
    ownerPrompt: "CG-035",
  },
  {
    relativePath: "ArchLucid.Application/Exports/SponsorRoiPacketDispositionResolver.cs",
    leakClass: "related",
    ownerPrompt: "CG-035",
  },
  {
    relativePath: "ArchLucid.Application/Pilots/FirstValueReportBuilder.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-022",
  },
  {
    relativePath: "archlucid-ui/src/lib/architecture/architecture-sponsor-dashboard-evidence-copy.ts",
    leakClass: "related",
    ownerPrompt: "CG-091",
  },
  {
    relativePath: "archlucid-ui/src/components/SponsorRoiBaselineGateNotice.tsx",
    leakClass: "eval-ok",
    ownerPrompt: "CG-035",
  },
] as const;
