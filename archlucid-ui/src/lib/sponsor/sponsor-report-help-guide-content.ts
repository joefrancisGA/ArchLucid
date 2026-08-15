import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";

export const SPONSOR_SUMMARY_HELP_PAGE_TITLE = "Sponsor report";

export const SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE =
  "What ArchLucid is, sponsor-safe pilot proof, and what executives should expect in exports.";

export const SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_BUYER =
  "What ArchLucid is, what sponsors should expect from pilot proof, and measurable value framing.";

export const SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR = SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE;

export function SponsorReportHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_BUYER
    : SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR;
}

export const SPONSOR_SUMMARY_HELP_OVERVIEW =
  "Start here for a buyer-safe product overview, then open sponsor outputs when you need live pilot proof or ROI framing.";

export const SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS = {
  startFirstReview: {
    label: BUYER_START_ARCHITECTURE_REVIEW_CTA,
    href: REVIEWS_NEW_PATH,
  },
  firstArchitectureReview: {
    label: "Your first architecture review",
    href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  },
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
