/** Canonical product language for three distinct "correlation" senses (TB-2065 / ADR 0063 round 5). */

export const CROSS_REVIEW_FINDING_CORRELATION_LABEL = "Cross-review finding correlation";

export const CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE =
  `${CROSS_REVIEW_FINDING_CORRELATION_LABEL} (export parity)`;

export const CROSS_REVIEW_FINDING_CORRELATION_SHORT =
  "Matches findings across two finalized reviews for compare and replay exports (ADR 0063 policy rule + fingerprint, with possible-match honesty).";

export const ITSM_TICKET_LINKAGE_LABEL = "ITSM ticket linkage";

export const ITSM_TICKET_LINKAGE_SHORT =
  "Registers which external Jira, Azure Boards, or ServiceNow ticket tracks this finding — not cross-review identity.";

export const ROI_PORTFOLIO_FINDING_DEDUP_LABEL = "Portfolio finding deduplication";

export const ROI_PORTFOLIO_FINDING_DEDUP_SHORT =
  "Executive ROI headline savings deduplicate overlapping findings by stable FindingId within the portfolio window — not compare export correlation.";

export const FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_TITLE =
  "Three different “correlation” meanings in ArchLucid";

export const FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_LINES: readonly {
  readonly label: string;
  readonly description: string;
}[] = [
  { label: CROSS_REVIEW_FINDING_CORRELATION_LABEL, description: CROSS_REVIEW_FINDING_CORRELATION_SHORT },
  { label: ITSM_TICKET_LINKAGE_LABEL, description: ITSM_TICKET_LINKAGE_SHORT },
  { label: ROI_PORTFOLIO_FINDING_DEDUP_LABEL, description: ROI_PORTFOLIO_FINDING_DEDUP_SHORT },
] as const;

export const ITSM_TICKET_LINKAGE_CREATE_INTRO =
  "Create a linked Jira issue, Azure Boards work item, or ServiceNow incident from this finding in one click.";

export const ITSM_TICKET_LINKAGE_DUPLICATE_BLOCKED =
  "Duplicate ticket creation per provider is blocked when an ITSM ticket linkage already exists.";

export const ITSM_TICKET_LINKAGE_LIST_HEADING = "Registered ITSM ticket linkages";

export const ITSM_ADMIN_TICKET_LINKAGE_DESCRIPTION =
  "Outbound ITSM ticket linkage and tenant connector settings.";
