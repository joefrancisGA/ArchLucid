export type TrustCenterRevisionEntry = {
  readonly effectiveDate: string;
  readonly documentVersion: string;
  readonly summary: string;
};

/** Published Trust Center revision log for procurement reviewers. */
export const TRUST_CENTER_REVISION_HISTORY: readonly TrustCenterRevisionEntry[] = [
  {
    effectiveDate: "2026-08-15",
    documentVersion: "2026.05",
    summary:
      "Trust Center layout pass — single evidence-pack download path, merged help cross-links, revision history, and Sources-only footer (removed redundant public-assurance claim callout).",
  },
  {
    effectiveDate: "2026-05-01",
    documentVersion: "2026.04",
    summary: "Initial structured Trust Center with public downloads, planned assurance table, and diligence contact.",
  },
] as const;
