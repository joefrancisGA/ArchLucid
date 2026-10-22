import type { HelpTopicMarkdownPrimaryAction } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import type { EvidenceAdminSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS } from "@/lib/report-a-problem-help-guide-content";
import {
  REPORT_A_PROBLEM_HELP_RELATED_GUIDES,
  REPORT_A_PROBLEM_HELP_RELATED_HEADING,
  reportAProblemHelpRelatedGuides,
} from "@/lib/report-a-problem-help-related-guides";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";

export const REPORT_A_PROBLEM_HELP_CANONICAL_PATH = SUPPORT_REPORT_PROBLEM_HELP_HREF;

export const REPORT_A_PROBLEM_HELP_TOPIC_LABEL = "How structured support intake works" as const;

export const REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE =
  "This guide orients architects on structured support intake and correlation identifiers — open Support or Troubleshooting when you need live triage or workspace support tools.";

export const REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const REPORT_A_PROBLEM_HELP_CLAIM_HEADING_ID = "help-report-a-problem-claim-discipline-heading" as const;

export const REPORT_A_PROBLEM_HELP_SOURCES_INTRO =
  "Use these follow-ups when support intake vocabulary turns into symptom triage, admin support tools, or engineering diagnostics.";

/** Primary CTA — Support workspace for bundle download and email templates (TB-1741). */
export const REPORT_A_PROBLEM_HELP_PRIMARY_ACTION: HelpTopicMarkdownPrimaryAction = {
  label: REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.label,
  href: REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.href,
  testId: REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.testId,
};

export const REPORT_A_PROBLEM_HELP_RELATED = reportAProblemHelpRelatedGuides();

export { REPORT_A_PROBLEM_HELP_RELATED_HEADING };

/** Operator Sources — no self-href to `/help/report-a-problem`. */
export const REPORT_A_PROBLEM_HELP_SOURCES: readonly EvidenceAdminSourceLink[] = [
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("engineering-troubleshooting"), adminOnly: true },
  { label: "Support workspace", href: SETTINGS_SUPPORT_PATH, adminOnly: true },
  { label: "System health", href: "/administration/system-health", adminOnly: true },
  { label: "Alerts", href: GOVERNANCE_ALERTS_PATH },
] as const;

export { REPORT_A_PROBLEM_HELP_RELATED_GUIDES };
