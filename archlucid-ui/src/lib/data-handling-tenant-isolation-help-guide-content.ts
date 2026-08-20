import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_TOPIC_TITLE = "Data handling";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_EYEBROW = "Help topic" as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE = "Data handling and tenant isolation";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE =
  "How review evidence flows, what stays in your tenant, and how logical isolation is enforced — with sponsor-safe diligence cites.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE_BUYER =
  "Review evidence flow, tenant isolation layers, and sponsor-safe diligence cites for procurement questions." as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_CONTENT_ID =
  "help-data-handling-tenant-isolation-primary-content" as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_SKIP_LINK_LABEL = "Skip to data handling guide" as const;

export function dataHandlingTenantIsolationHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE_BUYER
    : DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE;
}

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_LEAD =
  "This guide covers data flow for architecture reviews, three-layer tenant isolation, and what ArchLucid does not claim for standard SaaS.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_PREFIX =
  "Cross-check isolation statements against Security and trust, the Trust Center, and";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_SUFFIX =
  "before treating this page as a procurement attestation.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CONTRACTED_PACK_FOLLOW_UP =
  "For your contracted security diligence pack, use your order documents or contact your account team.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID = "related-topics";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING = "Related topics";

export type DataHandlingTenantIsolationHelpLeavesStaysCard = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly sectionAnchor: string;
};

/** First-viewport orientation cards — summaries only; full sections remain in markdown (TB-1654). */
export const DATA_HANDLING_TENANT_ISOLATION_HELP_LEAVES_STAYS_CARDS: readonly DataHandlingTenantIsolationHelpLeavesStaysCard[] =
  [
    {
      id: "leaves",
      title: "What leaves your tenant",
      summary:
        "Architecture brief text and evidence context may be sent to the configured model provider for review outputs. ArchLucid does not send repositories, secrets, or credentials on the standard intake path.",
      sectionAnchor: "what-leaves-your-tenant",
    },
    {
      id: "stays",
      title: "What stays in your tenant",
      summary:
        "Findings, sealed review records, decisions, governance approvals, and audit log entries stay in your tenant database without product-analytics copies outside your boundary.",
      sectionAnchor: "what-stays-in-your-tenant",
    },
  ] as const;

export type DataHandlingTenantIsolationHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

/** Diligence next steps surfaced above the essay (TB-1655). */
export const DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED: readonly DataHandlingTenantIsolationHelpRelatedLink[] = [
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "Trust Center", href: "/trust" },
  { label: "Audit trail", href: inAppHelpHref("audit-trail") },
  { label: "Subprocessors", href: inAppHelpHref("subprocessors") },
  { label: "DPA template", href: inAppHelpHref("dpa-template") },
  { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
] as const;

export type DataHandlingTenantIsolationHelpCrossCheckLink = {
  readonly label: string;
  readonly href: string;
};

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS: readonly DataHandlingTenantIsolationHelpCrossCheckLink[] =
  [{ label: "Related topics", href: `#${DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID}` }] as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS_BUYER: readonly DataHandlingTenantIsolationHelpCrossCheckLink[] =
  [{ label: "Where to go next", href: "#related-diligence-artifacts" }] as const;

export function dataHandlingTenantIsolationHelpOverviewCrossCheckLinks(
  buyerPolishedShell: boolean,
): readonly DataHandlingTenantIsolationHelpCrossCheckLink[] {
  return buyerPolishedShell
    ? DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS_BUYER
    : DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS;
}

export const DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_HELP_CENTER_LABEL = "Help Center";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_SECURITY_TRUST_LABEL = "Security and trust";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS = {
  openTrustCenter: {
    label: "Open Trust Center",
    href: "/trust",
  },
  openAuditTrail: {
    label: "audit trail",
    href: GOVERNANCE_AUDIT_PATH,
  },
} as const;
