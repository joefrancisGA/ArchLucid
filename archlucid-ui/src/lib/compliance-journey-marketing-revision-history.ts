export type ComplianceJourneyRevisionEntry = {
  readonly effectiveDate: string;
  readonly documentVersion: string;
  readonly summary: string;
};

/** Published Compliance journey revision log for procurement reviewers. */
export const COMPLIANCE_JOURNEY_REVISION_HISTORY: readonly ComplianceJourneyRevisionEntry[] = [
  {
    effectiveDate: "2026-08-15",
    documentVersion: "2026.05",
    summary:
      "Compliance journey layout pass — skip link, hero last-reviewed meta, Assurance status links, demoted scope disclosure, revision history, and Sources-only footer (removed amber posture callout).",
  },
  {
    effectiveDate: "2026-05-01",
    documentVersion: "2026.04",
    summary: "Initial staged compliance journey with Trust Center CTA and diligence help pointers.",
  },
] as const;
