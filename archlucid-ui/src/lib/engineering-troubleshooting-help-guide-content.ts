import { DEVELOPER_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE = "Engineering troubleshooting runbook";

export const ENGINEERING_TROUBLESHOOTING_HELP_PAGE_SUBTITLE =
  "Admin-only CLI, environment, and log triage for engineering support. Operators and customers should use Troubleshooting instead.";

export const ENGINEERING_TROUBLESHOOTING_HELP_OVERVIEW =
  "Use this runbook when you need eng-depth failure signatures after customer Troubleshooting and System health. Keep Operators on the customer Troubleshooting guide — this page stays Admin-gated and is not a sponsor diligence pack.";

export const ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE =
  "This Admin eng runbook is operational triage evidence for support engineers — not customer self-serve help and not certification.";

export const ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS = {
  openCustomerTroubleshooting: {
    label: "Customer Troubleshooting",
    href: inAppHelpHref("troubleshooting"),
  },
  openSystemHealth: {
    label: "System health",
    href: "/administration/system-health",
  },
  openReportAProblem: {
    label: "Report a problem",
    href: inAppHelpHref("report-a-problem"),
  },
  openCliUsage: {
    label: "CLI usage",
    href: inAppHelpHref("cli-usage"),
  },
} as const;

export type EngineeringTroubleshootingHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Admin Sources — no self-href to this eng runbook. */
export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES: readonly EngineeringTroubleshootingHelpSourceLink[] =
  [
    { label: "Customer Troubleshooting", href: inAppHelpHref("troubleshooting") },
    { label: "Admin diagnostics", href: inAppHelpHref("admin-diagnostics") },
    { label: "CLI usage", href: inAppHelpHref("cli-usage") },
    { label: "Configuration reference", href: inAppHelpHref("configuration-reference") },
    { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
    { label: "System health", href: "/administration/system-health" },
  ] as const;

export const ENGINEERING_TROUBLESHOOTING_HELP_CANONICAL_PATH = DEVELOPER_TROUBLESHOOTING_HELP_PATH;
