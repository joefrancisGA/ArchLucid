export type AssuranceStatusRevisionEntry = {
  readonly effectiveDate: string;
  readonly documentVersion: string;
  readonly summary: string;
};

/** Published Assurance status revision log for procurement reviewers. */
export const ASSURANCE_STATUS_REVISION_HISTORY: readonly AssuranceStatusRevisionEntry[] = [
  {
    effectiveDate: "2026-08-15",
    documentVersion: "2026.05",
    summary:
      "Assurance status layout pass — canonical /assurance-status route, assurance ladder as primary IA, demoted Related trust surfaces disclosure, Sources-only footer, revision history, and review cadence labels.",
  },
  {
    effectiveDate: "2026-05-01",
    documentVersion: "2026.04",
    summary: "Initial public assurance ladder with engagement metadata, NDA handling, and Trust Center cross-links.",
  },
] as const;
