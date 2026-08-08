import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ADMINISTRATION_HUB_CLAIM_DISCIPLINE =
  "Settings is the configuration launcher for workspace, identity, billing, security, and support — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open System health, Audit, or a signed record when you need operational or sponsor-safe trails.";

export const ADMINISTRATION_HUB_SOURCES_INTRO =
  "Use these follow-ups when configuration browsing turns into readiness checks, activity trails, or governance disposition.";

export type AdministrationHubSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the Settings hub. */
export const ADMINISTRATION_HUB_SOURCES: readonly AdministrationHubSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Governance findings", href: "/governance/findings" },
  { label: "Configuration reference help", href: inAppHelpHref("configuration-reference") },
] as const;
