export type ExampleRoiBulletinRevisionEntry = {
  readonly effectiveDate: string;
  readonly documentVersion: string;
  readonly summary: string;
};

/** Published Example ROI bulletin revision log for buyer orientation. */
export const EXAMPLE_ROI_BULLETIN_REVISION_HISTORY: readonly ExampleRoiBulletinRevisionEntry[] = [
  {
    effectiveDate: "2026-08-15",
    documentVersion: "2026.05",
    summary:
      "Layout pass — skip link, hero last-reviewed meta, demoted scope disclosure, revision history, value-first hero copy, buyer-safe Markdown prep (no duplicate H1 or repo preamble), shortened sample table notes, and Sources-only footer (removed amber claim callout).",
  },
  {
    effectiveDate: "2026-08-11",
    documentVersion: "2026.04",
    summary:
      "Buyer CTA rewrite — methodology help and Trust Center rank above operator admin preview; synthetic sample primary with Markdown source disclosure (TB-1516–TB-1520).",
  },
] as const;
