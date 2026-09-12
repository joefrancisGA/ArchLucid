/** Relative to repository root (parent of archlucid-ui). */
export const LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_INVENTORY_DOC_PATH =
  "docs/architecture/LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_INVENTORY.md" as const;

export type LivelihoodGradeNoHardInfeasibleRow = {
  readonly surface: string;
  readonly fieldPath: string;
  readonly citationRequiredOnWorkingCareerExport: boolean;
  readonly ownerPrompt: string;
};

/** Shrink-only baseline (LN-002). */
export const LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS: readonly LivelihoodGradeNoHardInfeasibleRow[] = [
  {
    surface: "Manifest feasibility verdict",
    fieldPath: "goldenManifest.feasibilityVerdict.kind",
    citationRequiredOnWorkingCareerExport: true,
    ownerPrompt: "LN-004",
  },
  {
    surface: "Career artifact honesty (TS)",
    fieldPath: "evaluateCareerArtifactHonesty",
    citationRequiredOnWorkingCareerExport: true,
    ownerPrompt: "LN-004",
  },
  {
    surface: "Career artifact honesty (C#)",
    fieldPath: "CareerArtifactCompletenessValidator",
    citationRequiredOnWorkingCareerExport: true,
    ownerPrompt: "LN-004",
  },
  {
    surface: "Decision receipt",
    fieldPath: "resolveDecisionReceiptExportBlockedReason",
    citationRequiredOnWorkingCareerExport: true,
    ownerPrompt: "LN-038",
  },
  {
    surface: "CLI export/finalize",
    fieldPath: "archlucid stdout/json",
    citationRequiredOnWorkingCareerExport: true,
    ownerPrompt: "LN-023",
  },
];
