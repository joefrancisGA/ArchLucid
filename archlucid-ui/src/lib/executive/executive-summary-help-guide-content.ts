import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

export const EXECUTIVE_SUMMARY_HELP_PAGE_TITLE = "Executive summary";

export const EXECUTIVE_SUMMARY_HELP_PAGE_SUBTITLE =
  "Sponsor-safe summaries, ROI basis labels, and what executives should expect in exports.";

export const EXECUTIVE_SUMMARY_HELP_PAGE_SUBTITLE_BUYER =
  "What sponsors should expect from pilot proof, measurable value, and executive exports.";

export const EXECUTIVE_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR = EXECUTIVE_SUMMARY_HELP_PAGE_SUBTITLE;

export function executiveSummaryHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? EXECUTIVE_SUMMARY_HELP_PAGE_SUBTITLE_BUYER
    : EXECUTIVE_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR;
}

export const EXECUTIVE_SUMMARY_HELP_OVERVIEW =
  "Use this guide for sponsor-safe pilot outcomes, measurable value framing, and honest limits before opening the live executive value report or dashboard.";

export const EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS = {
  openExecutiveValueReport: {
    label: "Open executive value report",
    href: SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  },
  openExecutiveDashboard: {
    label: "Open executive dashboard",
    href: EXECUTIVE_DASHBOARD_HREF,
  },
  pilotRoiModel: {
    label: "Pilot ROI measurement",
    href: inAppHelpHref("executive-summary", "pilot-roi-measurement"),
  },
} as const;
