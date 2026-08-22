import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { resolveRelatedFollowUpsTitle } from "@/lib/help/related-follow-ups-title";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import { TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/troubleshooting-help-evidence-copy";

/** TB-1745 — at most three related guides for the support-intake job. */
export const REPORT_A_PROBLEM_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: TROUBLESHOOTING_HELP_TOPIC_LABEL, href: inAppHelpHref("troubleshooting") },
  { label: "Support workspace", href: SETTINGS_SUPPORT_PATH },
  { label: "Contact support", href: inAppHelpHref("contact-support") },
] as const;

export const REPORT_A_PROBLEM_HELP_RELATED_HEADING = resolveRelatedFollowUpsTitle(
  REPORT_A_PROBLEM_HELP_RELATED_GUIDES,
);

export const REPORT_A_PROBLEM_HELP_RELATED_TEST_ID = "help-report-a-problem-related-help";

/** Related guides for `/help/report-a-problem`. */
export function reportAProblemHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return REPORT_A_PROBLEM_HELP_RELATED_GUIDES;
}
