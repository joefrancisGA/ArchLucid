/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_BADGE_PIPELINE_COPY_INVENTORY_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_BADGE_PIPELINE_COPY_INVENTORY.md" as const;

export type CareerGravityBadgePipelineLeakClass =
  | "covered"
  | "bypass"
  | "security-skip"
  | "mismatch"
  | "eval-ok";

export type CareerGravityBadgePipelineRow = {
  readonly relativePath: string;
  readonly leakClass: CareerGravityBadgePipelineLeakClass;
  readonly ownerPrompt: string;
};

/** Security product line hides ArchLucid training and Career/Rehearsal chrome (CG-017 / SecureNow production shell). */
export const CAREER_GRAVITY_SECURITY_CHOOSER_SKIP_PATH =
  "archlucid-ui/src/components/shell/OperatorShellTopBar.tsx" as const;

export const CAREER_GRAVITY_SECURITY_CHOOSER_SKIP_MARKER =
  'showTrainingChrome = !isSecureNowTrainingChromeExcluded(productLine)' as const;

export const CAREER_GRAVITY_BADGE_PIPELINE_COPY_ROWS: readonly CareerGravityBadgePipelineRow[] = [
  {
    relativePath: "archlucid-ui/src/lib/pipeline-status-labels.ts",
    leakClass: "covered",
    ownerPrompt: "CG-031",
  },
  {
    relativePath: "archlucid-ui/src/lib/runs/run-pipeline-status-presentation.ts",
    leakClass: "covered",
    ownerPrompt: "CG-031",
  },
  {
    relativePath: "archlucid-ui/src/components/runs/RunStatusBadge.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-031",
  },
  {
    relativePath: "archlucid-ui/src/components/runs/use-run-progress-tracker.ts",
    leakClass: "covered",
    ownerPrompt: "CG-032",
  },
  {
    relativePath: "archlucid-ui/src/components/runs/RunProgressTracker.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-032",
  },
  {
    relativePath: "archlucid-ui/src/lib/enterprise-status-kind-resolver.ts",
    leakClass: "covered",
    ownerPrompt: "CG-004",
  },
  {
    relativePath: "archlucid-ui/src/lib/first-pilot-operating-rail-status.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-085",
  },
  {
    relativePath: "archlucid-ui/src/lib/run-detail-workspace-derive/workspace-status.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-031",
  },
  {
    relativePath: "archlucid-ui/src/lib/first-pilot-command-center-phase.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-085",
  },
  {
    relativePath: "archlucid-ui/src/hooks/use-review-presenter-elicitation.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-049",
  },
  {
    relativePath: "archlucid-ui/src/lib/i18n.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-033",
  },
  {
    relativePath: CAREER_GRAVITY_SECURITY_CHOOSER_SKIP_PATH,
    leakClass: "security-skip",
    ownerPrompt: "CG-017",
  },
  {
    relativePath: "archlucid-ui/src/lib/governance/working-career-rehearsal-door.ts",
    leakClass: "mismatch",
    ownerPrompt: "CG-020",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageView.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-023",
  },
] as const;
