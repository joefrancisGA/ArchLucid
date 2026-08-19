export type GetStartedRevisionEntry = {
  readonly effectiveDate: string;
  readonly documentVersion: string;
  readonly summary: string;
};

/** Published Get started revision log for buyer orientation. */
export const GET_STARTED_REVISION_HISTORY: readonly GetStartedRevisionEntry[] = [
  {
    effectiveDate: "2026-08-15",
    documentVersion: "2026.05",
    summary:
      "Get started layout pass — skip link, hero last-reviewed meta, demoted scope disclosure, revision history, path scroll targets, and Sources-only footer (removed amber orientation callout).",
  },
  {
    effectiveDate: "2026-05-01",
    documentVersion: "2026.04",
    summary: "Dual-path onboarding with illustrative samples and guided trial milestones.",
  },
] as const;
