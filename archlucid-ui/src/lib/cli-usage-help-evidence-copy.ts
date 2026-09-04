import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const CLI_USAGE_HELP_CANONICAL_PATH = "/help/cli-usage" as const;

export const CLI_USAGE_HELP_TOPIC_LABEL = "How CLI usage works" as const;

export const CLI_USAGE_HELP_CLAIM_DISCIPLINE =
  "This guide is an engineering runbook for non-interactive commands and environment detail — it is not customer self-serve diligence. Prefer customer Troubleshooting and System health before treating CLI output as certification evidence.";

export const CLI_USAGE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const CLI_USAGE_HELP_SOURCES_INTRO =
  "Use these follow-ups when CLI vocabulary turns into customer triage, eng troubleshooting, or API contracts.";


/** Operator/eng Sources — no self-href to `/help/cli-usage`. */
export const CLI_USAGE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Customer Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("engineering-troubleshooting") },
  { label: "API contracts", href: inAppHelpHref("api-contracts") },
  { label: "System health", href: "/administration/system-health" },
] as const;
