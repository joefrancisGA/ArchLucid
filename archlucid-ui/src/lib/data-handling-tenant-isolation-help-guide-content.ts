import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE = "Data handling and tenant isolation";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE =
  "How review evidence flows, what stays in your tenant, and how logical isolation is enforced — with sponsor-safe diligence cites.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_LEAD =
  "This guide covers data flow for architecture reviews, three-layer tenant isolation, and what ArchLucid does not claim for standard SaaS.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_PREFIX =
  "Cross-check isolation statements against";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_SUFFIX =
  "before treating this page as a procurement attestation.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID = "related-topics";

export type DataHandlingTenantIsolationHelpCrossCheckLink = {
  readonly label: string;
  readonly href: string;
};

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS: readonly DataHandlingTenantIsolationHelpCrossCheckLink[] =
  [
    { label: "Security and trust", href: inAppHelpHref("security-trust") },
    { label: "Related topics", href: `#${DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID}` },
    { label: "your contracted diligence pack", href: "/trust" },
  ] as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_ACTION_PANEL_TITLE = "Diligence materials";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING = "Data residency";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING_ID = "data-residency";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY =
  "Hosted ArchLucid runs on vendor-hosted Azure workloads. Primary processing regions follow the contracted Azure regions and private-connectivity setup negotiated at onboarding — confirm residency in your order or security diligence pack, not from in-product region pickers alone.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_AUDIT_TRAIL_LINK_LABEL = "audit trail";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_AUDIT_TRAIL_SENTENCE_PREFIX = "Open the";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_AUDIT_TRAIL_SENTENCE_SUFFIX =
  "in your tenant governance workspace.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_HELP_CENTER_LABEL = "Help Center";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_SECURITY_TRUST_LABEL = "Security and trust";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS = {
  openTrustCenter: {
    label: "Open Trust Center",
    href: "/trust",
  },
  securityTrust: {
    label: "Security and trust",
    href: inAppHelpHref("security-trust"),
  },
  openAuditTrail: {
    label: DATA_HANDLING_TENANT_ISOLATION_HELP_AUDIT_TRAIL_LINK_LABEL,
    href: GOVERNANCE_AUDIT_PATH,
  },
} as const;
