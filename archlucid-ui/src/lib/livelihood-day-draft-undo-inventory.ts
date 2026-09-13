/** Relative to repository root (parent of archlucid-ui). */
export const LIVELIHOOD_DAY_DRAFT_UNDO_INVENTORY_DOC_PATH =
  "docs/architecture/LIVELIHOOD_DAY_DRAFT_UNDO_INVENTORY.md" as const;

export type LivelihoodDayDraftUndoScope = "in-tab" | "governed-toast" | "forbidden";

export type LivelihoodDayDraftUndoSurfaceRow = {
  readonly surface: string;
  readonly scope: LivelihoodDayDraftUndoScope;
  readonly notes: string;
};

/** LY-041 — inventory only. Do not lengthen 300s. Do not unseal. */
export const LIVELIHOOD_DAY_DRAFT_UNDO_SURFACES: readonly LivelihoodDayDraftUndoSurfaceRow[] = [
  {
    surface: "Working draft document undo stacks",
    scope: "in-tab",
    notes: "ADR 0071 in-memory stacks. Lost on refresh. Disabled when spawn-locked.",
  },
  {
    surface: "Draft desk keyboard undo/redo",
    scope: "in-tab",
    notes: "Same stacks as architecture-draft-document-undo. Not a second kernel.",
  },
  {
    surface: "Finding disposition Undo toast",
    scope: "governed-toast",
    notes: "MUTATION_UNDO_WINDOW_SECONDS = 300. Visible, not unseal authority.",
  },
  {
    surface: "Sealed review record",
    scope: "forbidden",
    notes: "ADR 0039. Finalize is permanent. Record correction is append-only.",
  },
];
