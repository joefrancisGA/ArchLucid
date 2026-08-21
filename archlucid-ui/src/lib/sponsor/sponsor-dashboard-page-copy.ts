import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

export const SPONSOR_DASHBOARD_PAGE_TITLE = BUYER_SPONSOR_SUMMARY_VOCABULARY.portfolioPageTitle;

export const SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR =
  BUYER_SPONSOR_SUMMARY_VOCABULARY.portfolioPageLead;

export const SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER =
  BUYER_SPONSOR_SUMMARY_VOCABULARY.portfolioPageLead;

/** Sponsor-safe lead on the sponsor dashboard — not env-gated (TB-1533). */
export function executiveDashboardPageSubtitle(): string {
  return SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER;
}

export const SPONSOR_DASHBOARD_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const SPONSOR_DASHBOARD_ACTION_REFRESH = "Refresh" as const;

export const SPONSOR_DASHBOARD_ACTION_REFRESHING = "Refreshing…" as const;

export const SPONSOR_DASHBOARD_SCOPE_DETAILS_TRIGGER = "About this dashboard" as const;
