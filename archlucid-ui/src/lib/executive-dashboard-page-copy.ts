import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

export const EXECUTIVE_DASHBOARD_PAGE_TITLE = BUYER_EXECUTIVE_SUMMARY_VOCABULARY.portfolioPageTitle;

export const EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR =
  BUYER_EXECUTIVE_SUMMARY_VOCABULARY.portfolioPageLead;

export const EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER =
  "Track governance posture, ROI impact, and sponsor-ready proof across finalized reviews.";

export function executiveDashboardPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER
    : EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR;
}

export const EXECUTIVE_DASHBOARD_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const EXECUTIVE_DASHBOARD_ACTION_REFRESH = "Refresh" as const;

export const EXECUTIVE_DASHBOARD_ACTION_REFRESHING = "Refreshing…" as const;

export const EXECUTIVE_DASHBOARD_SCOPE_DETAILS_TRIGGER = "About this dashboard" as const;
