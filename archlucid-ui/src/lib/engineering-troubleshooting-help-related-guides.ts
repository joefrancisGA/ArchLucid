import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { CLI_USAGE_HELP_TOPIC_LABEL } from "@/lib/cli-usage-help-evidence-copy";
import { ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL } from "@/lib/admin-diagnostics-help-evidence-copy";
import { buildEngineeringTroubleshootingRelatedGuideHref } from "@/lib/help/help-engineering-troubleshooting-return";
import { resolveRelatedFollowUpsTitle } from "@/lib/help/related-follow-ups-title";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/troubleshooting-help-evidence-copy";

export type EngineeringTroubleshootingHelpRelatedGuide = EvidenceSourceLink & {
  readonly description?: string;
};

/** TB-2266 — at most three related diligence guides for the engineering runbook job. */
export const ENGINEERING_TROUBLESHOOTING_HELP_RELATED_GUIDES: readonly EngineeringTroubleshootingHelpRelatedGuide[] =
  [
    {
      label: TROUBLESHOOTING_HELP_TOPIC_LABEL,
      href: buildEngineeringTroubleshootingRelatedGuideHref(inAppHelpHref("troubleshooting")),
      description: "Customer self-serve recovery paths before eng-depth CLI and migration triage.",
    },
    {
      label: ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL,
      href: buildEngineeringTroubleshootingRelatedGuideHref(inAppHelpHref("admin-diagnostics")),
      description: "Live platform-health signals and readiness checks before opening this runbook.",
    },
    {
      label: CLI_USAGE_HELP_TOPIC_LABEL,
      href: buildEngineeringTroubleshootingRelatedGuideHref(inAppHelpHref("cli-usage")),
      description: "Command reference and environment variables when symptom lookup points to CLI depth.",
    },
  ] as const;

export const ENGINEERING_TROUBLESHOOTING_HELP_RELATED_HEADING = resolveRelatedFollowUpsTitle(
  ENGINEERING_TROUBLESHOOTING_HELP_RELATED_GUIDES,
);

export const ENGINEERING_TROUBLESHOOTING_HELP_RELATED_TEST_ID =
  "help-engineering-troubleshooting-related-help";

/** Related guides for `/help/engineering-troubleshooting`. */
export function engineeringTroubleshootingHelpRelatedGuides(): readonly EngineeringTroubleshootingHelpRelatedGuide[] {
  return ENGINEERING_TROUBLESHOOTING_HELP_RELATED_GUIDES;
}
