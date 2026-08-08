import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CLI_USAGE_HELP_CANONICAL_PATH = "/help/cli-usage" as const;

export const CLI_USAGE_HELP_CLAIM_DISCIPLINE =
  "This CLI usage reference is an engineering runbook for non-interactive commands and environment detail — it is not customer self-serve diligence. Prefer customer Troubleshooting and System health before treating CLI output as certification evidence.";

export const CLI_USAGE_HELP_SOURCES_INTRO =
  "Use these follow-ups when CLI vocabulary turns into customer triage, eng troubleshooting, configuration, or API contracts.";

export type CliUsageHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator/eng Sources — no self-href to `/help/cli-usage`. */
export const CLI_USAGE_HELP_SOURCES: readonly CliUsageHelpSourceLink[] = [
  { label: "Customer Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("developer-troubleshooting") },
  { label: "Configuration reference", href: inAppHelpHref("configuration-reference") },
  { label: "API contracts", href: inAppHelpHref("governance-api-contracts") },
  { label: "System health", href: "/administration/system-health" },
] as const;
