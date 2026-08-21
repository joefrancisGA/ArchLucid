import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { CLI_USAGE_HELP_TOPIC_LABEL } from "@/lib/cli-usage-help-evidence-copy";
import { ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL } from "@/lib/admin-diagnostics-help-evidence-copy";
import { resolveRelatedFollowUpsTitle } from "@/lib/help/related-follow-ups-title";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/troubleshooting-help-evidence-copy";

/** TB-2266 — at most three related diligence guides for the engineering runbook job. */
export const ENGINEERING_TROUBLESHOOTING_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: TROUBLESHOOTING_HELP_TOPIC_LABEL, href: inAppHelpHref("troubleshooting") },
  { label: ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL, href: inAppHelpHref("admin-diagnostics") },
  { label: CLI_USAGE_HELP_TOPIC_LABEL, href: inAppHelpHref("cli-usage") },
] as const;

export const ENGINEERING_TROUBLESHOOTING_HELP_RELATED_HEADING = resolveRelatedFollowUpsTitle(
  ENGINEERING_TROUBLESHOOTING_HELP_RELATED_GUIDES,
);

export const ENGINEERING_TROUBLESHOOTING_HELP_RELATED_TEST_ID =
  "help-engineering-troubleshooting-related-help";

/** Related guides for `/help/engineering-troubleshooting`. */
export function engineeringTroubleshootingHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return ENGINEERING_TROUBLESHOOTING_HELP_RELATED_GUIDES;
}
