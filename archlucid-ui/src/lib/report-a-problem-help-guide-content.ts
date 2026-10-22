import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import {
  ARCHLUCID_SUPPORT_EMAIL,
  SUPPORT_REPORT_PROBLEM_HELP_HREF,
} from "@/lib/support-workspace-present";

export const REPORT_A_PROBLEM_HELP_PATH = SUPPORT_REPORT_PROBLEM_HELP_HREF;

export const REPORT_A_PROBLEM_HELP_PAGE_TITLE = "Report a problem";

export const REPORT_A_PROBLEM_HELP_PAGE_SUBTITLE =
  "Structured in-product support intake — when Report problem appears, what we capture with consent, and how to escalate when it does not.";

export const REPORT_A_PROBLEM_HELP_OVERVIEW =
  "When a core workflow fails, use Report problem on that page for structured context and a report reference. This guide explains the intake flow — it does not open the dialog itself.";

/** TB-1742 — honest fallback when the Help route has no Report problem trigger. */
export const REPORT_A_PROBLEM_HELP_NO_TRIGGER_CALLOUT =
  "This help page does not open Report problem. Use Report problem on the failing page when you see it. If Report problem is not available, open Support for bundle download and email templates (administrators), or email support below.";

export const REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS = {
  openSupport: {
    label: "Open Support",
    href: SETTINGS_SUPPORT_PATH,
    testId: "help-report-a-problem-open-support",
  },
  emailSupport: {
    label: "Email support",
    href: `mailto:${ARCHLUCID_SUPPORT_EMAIL}`,
    testId: "help-report-a-problem-email-support",
  },
  troubleshooting: {
    label: "Open Troubleshooting",
    href: inAppHelpHref("troubleshooting"),
    testId: "help-report-a-problem-open-troubleshooting",
  },
} as const;

/** TB-1744 — defer capture inventory below first-viewport orientation. */
export const REPORT_A_PROBLEM_HELP_DEFERRED_SECTION_ANCHORS = [
  "what-happens",
  "captured-fields",
  "never-capture",
  "support-bundle",
] as const;

export const REPORT_A_PROBLEM_HELP_DEFERRED_DETAILS_SUMMARY = "Submit flow and captured fields";

export const REPORT_A_PROBLEM_HELP_DEFERRED_DETAILS_TEST_ID = "help-report-a-problem-deferred-details";

export const REPORT_A_PROBLEM_HELP_WHERE_IT_APPEARS_HEADING = "Where Report problem appears";

export const REPORT_A_PROBLEM_HELP_WHERE_IT_APPEARS_TEST_ID = "help-report-a-problem-where-it-appears";
