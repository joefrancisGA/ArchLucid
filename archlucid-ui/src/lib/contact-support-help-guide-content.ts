import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import {
  ARCHLUCID_SUPPORT_EMAIL,
  SUPPORT_REPORT_PROBLEM_HELP_HREF,
} from "@/lib/support-workspace-present";

export const CONTACT_SUPPORT_HELP_PAGE_TITLE = "Contact support";

export const CONTACT_SUPPORT_HELP_BREADCRUMB_TOPIC_TITLE = "Contact support";

export const CONTACT_SUPPORT_HELP_SUBTITLE =
  "Report a problem on error pages, email support, or download a redacted diagnostics bundle.";

export const CONTACT_SUPPORT_HELP_PATH = inAppHelpHref("contact-support");

export const CONTACT_SUPPORT_HELP_OVERVIEW =
  "Use this page when you need help and are not already on an in-product error surface with Report problem.";

export const CONTACT_SUPPORT_HELP_ACTIONS_SECTION_TITLE = "Start here";

export const CONTACT_SUPPORT_HELP_PATH_TABLE_HEADING = "Choose the right path";

export const CONTACT_SUPPORT_HELP_EMAIL_SECTION_TITLE = "Email support";

export const CONTACT_SUPPORT_HELP_EMAIL_BODY =
  "Include workspace name, affected review or page, what you expected, and what happened. When you have one, add a report reference from Report problem or a correlation id from an error panel.";

export const CONTACT_SUPPORT_HELP_EMAIL_SLA_NOTE =
  "Structured in-product reports receive a next-business-day response commitment (see Report a problem and Security and trust). Email is a manual path and does not automatically mint a system report reference.";

export const CONTACT_SUPPORT_HELP_CHECKLIST_TITLE = "What to include";

export const CONTACT_SUPPORT_HELP_RELATED_HEADING = "Related topics";

export const CONTACT_SUPPORT_REPORT_PROBLEM_ARTICLE = {
  label: "How Report problem works",
  href: SUPPORT_REPORT_PROBLEM_HELP_HREF,
  testId: "contact-support-help-report-problem-article",
} as const;

export const CONTACT_SUPPORT_PRIMARY_ACTIONS = {
  reportProblemArticle: CONTACT_SUPPORT_REPORT_PROBLEM_ARTICLE,
  emailSupport: {
    label: "Email support",
    href: `mailto:${ARCHLUCID_SUPPORT_EMAIL}`,
    testId: "contact-support-help-email-support",
  },
  troubleshooting: {
    label: "Troubleshooting guide",
    href: inAppHelpHref("troubleshooting"),
    testId: "contact-support-help-troubleshooting",
  },
} as const;

export type ContactSupportHelpPathRow = {
  readonly situation: string;
  readonly actionLabel: string;
  readonly actionHref: string;
};

export const CONTACT_SUPPORT_HELP_PATH_ROWS: readonly ContactSupportHelpPathRow[] = [
  {
    situation: "A page shows Report problem (review failure, API problem, connectivity error)",
    actionLabel: "Use Report problem on that page",
    actionHref: SUPPORT_REPORT_PROBLEM_HELP_HREF,
  },
  {
    situation: "Something is broken but no Report problem control",
    actionLabel: "Open Troubleshooting, then email support",
    actionHref: inAppHelpHref("troubleshooting"),
  },
  {
    situation: "General product question (not a failure)",
    actionLabel: "Email support or ask your workspace administrator",
    actionHref: `mailto:${ARCHLUCID_SUPPORT_EMAIL}`,
  },
  {
    situation: "Support asked for diagnostics",
    actionLabel: "Download a redacted support bundle or open Administration → Support",
    actionHref: SETTINGS_SUPPORT_PATH,
  },
] as const;

/** Cross-links only — routing paths live in the path table above. */
export const CONTACT_SUPPORT_HELP_RELATED: readonly EvidenceSourceLink[] = [
  { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
] as const;

export const CONTACT_SUPPORT_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "contact-support-actions", title: CONTACT_SUPPORT_HELP_ACTIONS_SECTION_TITLE },
  { level: 2, id: "choose-the-right-path", title: CONTACT_SUPPORT_HELP_PATH_TABLE_HEADING },
  { level: 2, id: "email-support", title: CONTACT_SUPPORT_HELP_EMAIL_SECTION_TITLE },
  { level: 2, id: "related-topics", title: CONTACT_SUPPORT_HELP_RELATED_HEADING },
] as const;
