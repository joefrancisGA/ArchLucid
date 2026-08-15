import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { CLI_USAGE_HELP_TOPIC_LABEL } from "@/lib/cli-usage-help-evidence-copy";
import { CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL } from "@/lib/configuration-reference-help-guide-content";
import { ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/engineering-troubleshooting-help-guide-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** TB-2269 — at most three related diligence guides for the API contracts job. */
export const API_CONTRACTS_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL, href: inAppHelpHref("engineering-troubleshooting") },
  { label: CLI_USAGE_HELP_TOPIC_LABEL, href: inAppHelpHref("cli-usage") },
  { label: CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL, href: inAppHelpHref("configuration-reference") },
] as const;

export const API_CONTRACTS_HELP_RELATED_HEADING = "Related help" as const;

export const API_CONTRACTS_HELP_RELATED_TEST_ID = "help-api-contracts-related-help";

/** Related guides for `/help/api-contracts`. */
export function apiContractsHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return API_CONTRACTS_HELP_RELATED_GUIDES;
}
