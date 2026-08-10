import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE =
  "This page explains how ArchLucid handles review evidence and enforces tenant scope. It is architect orientation, and it is not a countersigned DPA.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO =
  "Use these follow-ups when isolation, signed review record, or audit trail claims need a cite trail beyond this guide.";

export type DataHandlingTenantIsolationHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/data-handling`. */
export const DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES: readonly DataHandlingTenantIsolationHelpSourceLink[] = [
  { label: "Trust Center", href: "/trust" },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "Subprocessors", href: inAppHelpHref("subprocessors") },
  { label: "DPA template", href: inAppHelpHref("dpa-template") },
  { label: "Signed review record", href: inAppHelpHref("review-packages") },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
] as const;
