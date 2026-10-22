/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_GRAVITY_DRAFT_SCREENSHOT_INVENTORY_DOC_PATH =
  "docs/architecture/SYSTEM_GRAVITY_DRAFT_SCREENSHOT_INVENTORY.md" as const;

export type SystemGravityDraftScreenshotLeakClass =
  | "covered"
  | "handoff"
  | "envelope-honesty"
  | "ready-literal";

export type SystemGravityDraftScreenshotRow = {
  readonly relativePath: string;
  readonly surface: string;
  readonly leakClass: SystemGravityDraftScreenshotLeakClass;
  readonly ownerPrompt: string;
  readonly sgPrompt: string;
};

/** SG-071 shrink-only inventory — draft/envelope surfaces that can screenshot as Record-complete. */
export const SYSTEM_GRAVITY_DRAFT_SCREENSHOT_ROWS: readonly SystemGravityDraftScreenshotRow[] = [
  {
    relativePath: "archlucid-ui/src/lib/architecture/architecture-identity-current-draft.ts",
    surface: "spawn-locked vs drafting desk state",
    leakClass: "handoff",
    ownerPrompt: "CE-034",
    sgPrompt: "SG-079",
  },
  {
    relativePath: "archlucid-ui/src/components/architecture/ArchitectureDraftHandoffPanel.tsx",
    surface: "spawn-lock handoff panel",
    leakClass: "handoff",
    ownerPrompt: "SN-013",
    sgPrompt: "SG-049",
  },
  {
    relativePath: "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskCurrentDraft.tsx",
    surface: "current architecture draft child slot",
    leakClass: "handoff",
    ownerPrompt: "SN-017",
    sgPrompt: "SG-072",
  },
  {
    relativePath: "archlucid-ui/src/lib/cheap-exploration-envelope-not-career-complete.ts",
    surface: "envelope complete not Career seal",
    leakClass: "envelope-honesty",
    ownerPrompt: "CE-012",
    sgPrompt: "SG-071",
  },
  {
    relativePath: "archlucid-ui/src/lib/governance/simulator-career-honesty.ts",
    surface: "Simulator Rehearsal Career gate",
    leakClass: "covered",
    ownerPrompt: "CG-030",
    sgPrompt: "SG-071",
  },
  {
    relativePath: "archlucid-ui/src/lib/runs/run-progress-tracker-career-honesty.ts",
    surface: "Rehearsal incomplete terminal status",
    leakClass: "envelope-honesty",
    ownerPrompt: "CE-012",
    sgPrompt: "SG-071",
  },
  {
    relativePath: "archlucid-ui/src/components/reviews/PreFinalizeChecklistPanel.tsx",
    surface: "Ready to finalize on review-detail",
    leakClass: "ready-literal",
    ownerPrompt: "CG-030",
    sgPrompt: "SG-071",
  },
  {
    relativePath: "archlucid-ui/src/lib/career-gravity-unlabeled-ready-inventory.ts",
    surface: "CG unlabeled Ready scan baseline",
    leakClass: "ready-literal",
    ownerPrompt: "CG-002",
    sgPrompt: "SG-071",
  },
] as const;
