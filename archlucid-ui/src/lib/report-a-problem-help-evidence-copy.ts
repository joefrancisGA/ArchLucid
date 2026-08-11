import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";
import type { EvidenceAdminSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance-route-paths";
import type { HelpTopicMarkdownPrimaryAction } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";

export const REPORT_A_PROBLEM_HELP_CANONICAL_PATH = SUPPORT_REPORT_PROBLEM_HELP_HREF;

export const REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE =
  "This Report a problem guide orients architects on structured support intake and correlation identifiers — it is help orientation, not a signed-review diligence Sources package from your tenant. Open Troubleshooting or Support when you need live triage or workspace support tools.";

export const REPORT_A_PROBLEM_HELP_SOURCES_INTRO =
  "Use these follow-ups when support intake vocabulary turns into symptom triage, admin support tools, or engineering diagnostics.";

/** Primary CTA — try recoverable fixes before escalating. */
export const REPORT_A_PROBLEM_HELP_PRIMARY_ACTION: HelpTopicMarkdownPrimaryAction = {
  label: "Open Troubleshooting",
  href: inAppHelpHref("troubleshooting"),
  testId: "help-report-a-problem-primary-action",
};

/** Operator Sources — no self-href to `/help/report-a-problem`. */
export const REPORT_A_PROBLEM_HELP_SOURCES: readonly EvidenceAdminSourceLink[] = [
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("engineering-troubleshooting"), adminOnly: true },
  { label: "Support workspace", href: "/administration/support", adminOnly: true },
  { label: "System health", href: "/administration/system-health", adminOnly: true },
  { label: "Alerts", href: GOVERNANCE_ALERTS_PATH },
] as const;
