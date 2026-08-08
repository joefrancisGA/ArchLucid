import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ADMIN_CONFIGURATION_CLAIM_DISCIPLINE =
  "Configuration summary lists effective non-sensitive deployment keys for administrators — it is not a signed-review diligence Sources package. Open Diagnostics, System health, or Audit when you need readiness or governed trails.";

export const ADMIN_CONFIGURATION_SOURCES_INTRO =
  "Use these follow-ups when a config key needs readiness checks, troubleshooting, or activity trails.";

export type AdminConfigurationSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to /internal/configuration. */
export const ADMIN_CONFIGURATION_SOURCES: readonly AdminConfigurationSourceLink[] = [
  { label: "Diagnostics dashboard", href: "/internal/health" },
  { label: "System health", href: "/administration/system-health" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Configuration help", href: inAppHelpHref("configuration-reference") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
] as const;
