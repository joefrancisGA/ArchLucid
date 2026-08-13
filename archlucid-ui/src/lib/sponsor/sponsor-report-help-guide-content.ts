import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

export const SPONSOR_SUMMARY_HELP_PAGE_TITLE = "Sponsor report";

export const SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE =
  "Sponsor-safe summaries, ROI basis labels, and what executives should expect in exports.";

export const SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_BUYER =
  "What sponsors should expect from pilot proof, measurable value, and sponsor exports.";

export const SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR = SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE;

export function SponsorReportHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_BUYER
    : SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR;
}

export const SPONSOR_SUMMARY_HELP_OVERVIEW =
  "Use this guide for sponsor-safe pilot outcomes, measurable value framing, and honest limits before opening the live sponsor value report or dashboard.";

export const SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS = {
  openSponsorValueReport: {
    label: "Open sponsor value report",
    href: SPONSOR_REPORT_PATH,
  },
  openSponsorDashboard: {
    label: "Open sponsor dashboard",
    href: SPONSOR_DASHBOARD_HREF,
  },
  pilotRoiModel: {
    label: "Sponsor ROI methodology",
    href: inAppHelpHref("sponsor-report", "pilot-roi-measurement"),
  },
} as const;
