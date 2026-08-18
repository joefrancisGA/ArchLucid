import { BUYER_VALUE_REPORT_PAGE_SUBTITLE } from "@/lib/buyer/buyer-polish-copy";
import { SPONSOR_REPORT_PAGE_SUBTITLE } from "@/lib/sponsor-report-navigation";

export const PILOT_OUTCOMES_PRIMARY_CONTENT_ID = "pilot-outcomes-primary-content" as const;

export const PILOT_OUTCOMES_SKIP_LINK_LABEL = "Skip to sponsor report" as const;

export const PILOT_OUTCOMES_LOADING_STATUS = "Generating sponsor report…" as const;

export const PILOT_OUTCOMES_LOAD_RETRY_LABEL = "Retry loading sponsor report" as const;

export function pilotOutcomesPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? BUYER_VALUE_REPORT_PAGE_SUBTITLE : SPONSOR_REPORT_PAGE_SUBTITLE;
}
