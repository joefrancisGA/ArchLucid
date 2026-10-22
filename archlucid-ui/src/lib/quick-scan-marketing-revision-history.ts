export type QuickScanRevisionEntry = {
  readonly effectiveDate: string;
  readonly documentVersion: string;
  readonly summary: string;
};

/** Published Quick scan revision log for buyer orientation. */
export const QUICK_SCAN_REVISION_HISTORY: readonly QuickScanRevisionEntry[] = [
  {
    effectiveDate: "2026-08-15",
    documentVersion: "2026.05",
    summary:
      "Quick scan layout pass — skip link, hero last-reviewed meta, demoted scope disclosure, revision history, touched-field validation, Enter-to-submit, progress and cancel affordances, result focus, and Sources-only footer (removed amber demo callout).",
  },
  {
    effectiveDate: "2026-05-01",
    documentVersion: "2026.04",
    summary: "No-sign-in marketing quick scan with capacity-aware sample fallback.",
  },
] as const;
