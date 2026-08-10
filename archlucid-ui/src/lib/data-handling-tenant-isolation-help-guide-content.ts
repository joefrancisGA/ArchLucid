import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE = "Data handling and tenant isolation";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE =
  "How review evidence flows, what stays in your tenant, and how logical isolation is enforced — with sponsor-safe diligence cites.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW =
  "This guide covers data flow for architecture reviews, three-layer tenant isolation, and what ArchLucid does not claim for standard SaaS. Cross-check isolation statements against Security and trust, Related topics, and your contracted diligence pack before treating this page as a procurement attestation.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_ACTION_PANEL_TITLE = "Continue diligence";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING = "Data residency";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING_ID = "data-residency";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY =
  "Hosted ArchLucid runs on vendor-hosted Azure workloads. Primary processing regions follow the contracted Azure regions and private-connectivity setup negotiated at onboarding — confirm residency in your order or security diligence pack, not from in-product region pickers alone.";

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
    label: "Open audit trail",
    href: GOVERNANCE_AUDIT_PATH,
  },
} as const;

/** Honesty note — isolation language is orientation, not a countersigned agreement. */
export const DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE =
  "This page explains how ArchLucid handles review evidence and enforces tenant scope. It is architect orientation, and it is not a countersigned DPA.";

