export type SeeItRevisionEntry = {
  readonly effectiveDate: string;
  readonly documentVersion: string;
  readonly summary: string;
};

/** Published See it revision log for buyer orientation. */
export const SEE_IT_REVISION_HISTORY: readonly SeeItRevisionEntry[] = [
  {
    effectiveDate: "2026-08-15",
    documentVersion: "2026.05",
    summary:
      "See it layout pass — skip link, hero last-reviewed meta, demoted scope disclosure, revision history, single hero showcase CTA, visual-only deliverable preview rail, softened sample summary labels, and Sources-only footer (removed amber claim callout).",
  },
  {
    effectiveDate: "2026-08-11",
    documentVersion: "2026.04",
    summary:
      "Hero budget and secondary PDF-only row — single primary showcase CTA, deliverable preview rail, honest marketing PDF label (TB-1281–TB-1283).",
  },
] as const;
