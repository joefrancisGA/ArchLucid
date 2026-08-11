import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

export const EXECUTIVE_DASHBOARD_PAGE_TITLE = BUYER_EXECUTIVE_SUMMARY_VOCABULARY.portfolioPageTitle;

export const EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR =
  BUYER_EXECUTIVE_SUMMARY_VOCABULARY.portfolioPageLead;

export const EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER =
  "Track governance posture, ROI impact, and sponsor-ready proof across finalized reviews.";

/** Sponsor-safe lead on the executive dashboard — not env-gated (TB-1533). */
export function executiveDashboardPageSubtitle(): string {
  return EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER;
}

export const EXECUTIVE_DASHBOARD_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const EXECUTIVE_DASHBOARD_ACTION_REFRESH = "Refresh" as const;

export const EXECUTIVE_DASHBOARD_ACTION_REFRESHING = "Refreshing…" as const;

export const EXECUTIVE_DASHBOARD_SCOPE_DETAILS_TRIGGER = "About this dashboard" as const;
