import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH = "/help/admin-diagnostics" as const;

export const ADMIN_DIAGNOSTICS_HELP_CLAIM_DISCIPLINE =
  "This Admin diagnostics guide orients operators on system status, workspace readiness, and observability signals — it is help orientation, not a CPA SOC 2 attestation, a published third-party pen-test report, or a signed-review diligence Sources package from your tenant. Open System health, Engineering troubleshooting, or Customer Troubleshooting when you need live probes or triage.";

export const ADMIN_DIAGNOSTICS_HELP_SOURCES_INTRO =
  "Use these follow-ups when diagnostics vocabulary turns into live health probes, eng runbooks, or customer triage.";

export type AdminDiagnosticsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/admin-diagnostics`. */
export const ADMIN_DIAGNOSTICS_HELP_SOURCES: readonly AdminDiagnosticsHelpSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Customer Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("developer-troubleshooting") },
  { label: "Configuration reference", href: inAppHelpHref("configuration-reference") },
  { label: "CLI usage", href: inAppHelpHref("cli-usage") },
] as const;
