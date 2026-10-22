import { SEARCH_PAGE_SUBTITLE } from "@/app/(operator)/insights/search-review-evidence/_sections/search-page-copy";
import { REVIEW_SCORECARD_PAGE_SUBTITLE } from "@/lib/pilot-scorecard-present";
import { ADVISORY_SCANS_PAGE_LEAD } from "@/lib/advisory-copy";
import { BUYER_VALUE_REPORT_PAGE_SUBTITLE } from "@/lib/buyer/buyer-polish-copy";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { AUDIT_TRAIL_PAGE_SUBTITLE } from "@/lib/audit-trail-page-copy";
import { ALERTS_CONFIGURATION_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import {
  BUYER_SPONSOR_SUMMARY_VOCABULARY,
  PILOT_FEEDBACK_VOCABULARY,
} from "@/lib/vocabulary/buyer-surface-vocabulary";
import { GOVERNANCE_SETUP_PAGE_SUBTITLE } from "@/lib/governance/governance-setup-route";
import { GOVERNANCE_OVERVIEW_PAGE_LEAD } from "@/lib/governance/governance-overview-copy";
import { RECURRENCE_SCHEDULES_PAGE_SUBTITLE } from "@/lib/recurrence-schedules-copy";
import { ROI_SUMMARY_PAGE_SUBTITLE } from "@/lib/roi-summary-sponsor-presentation";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";

import type { BuyerPolishedRouteOrientationOptions } from "@/lib/buyer/buyer-polished-route-orientation";

/**
 * Routes whose OperatorPageHeader (or page hero) already owns the intro copy.
 * Buyer-polished shell orientation must stay `null` here — never repeat these leads in LayerContextStrip.
 */
export type BuyerPolishedRoutePageLeadInventoryEntry = {
  readonly route: string;
  readonly operatorPageLead: string;
  readonly options?: BuyerPolishedRouteOrientationOptions;
};

export const BUYER_POLISHED_ROUTE_PAGE_LEAD_INVENTORY: readonly BuyerPolishedRoutePageLeadInventoryEntry[] = [
  { route: "/insights/architecture-scorecard", operatorPageLead: REVIEW_SCORECARD_PAGE_SUBTITLE },
  { route: SPONSOR_REPORT_PATH, operatorPageLead: BUYER_VALUE_REPORT_PAGE_SUBTITLE },
  { route: SPONSOR_REPORT_PATH, operatorPageLead: BUYER_SPONSOR_SUMMARY_VOCABULARY.scorecardLayerContextLine },
  { route: SPONSOR_REPORT_ROI_SUMMARY_PATH, operatorPageLead: ROI_SUMMARY_PAGE_SUBTITLE },
  { route: SPONSOR_REPORT_ROI_SUMMARY_PATH, operatorPageLead: BUYER_SPONSOR_SUMMARY_VOCABULARY.scorecardLayerContextLine },
  { route: "/insights/search-review-evidence", operatorPageLead: SEARCH_PAGE_SUBTITLE },
  { route: SPONSOR_DASHBOARD_HREF, operatorPageLead: BUYER_SPONSOR_SUMMARY_VOCABULARY.portfolioPageLead },
  { route: "/internal/product-learning", operatorPageLead: PILOT_FEEDBACK_VOCABULARY.pageLead },
  { route: "/internal/product-learning", operatorPageLead: PILOT_FEEDBACK_VOCABULARY.layerContextLine },
  { route: "/governance/approval-queue", operatorPageLead: GOVERNANCE_OVERVIEW_PAGE_LEAD },
  { route: "/governance/audit", operatorPageLead: AUDIT_TRAIL_PAGE_SUBTITLE },
  { route: "/governance/audit", operatorPageLead: GOVERNANCE_OVERVIEW_PAGE_LEAD },
  { route: "/governance/alert-rules", operatorPageLead: ALERTS_CONFIGURATION_PAGE_SUBTITLE },
  { route: "/governance/alert-rules", operatorPageLead: GOVERNANCE_OVERVIEW_PAGE_LEAD },
  { route: "/governance/advisory-scans", operatorPageLead: ADVISORY_SCANS_PAGE_LEAD },
  { route: "/advisory", operatorPageLead: ADVISORY_SCANS_PAGE_LEAD },
  { route: ADVISORY_SCANS_SCHEDULES_HREF, operatorPageLead: ADVISORY_SCANS_PAGE_LEAD },
  { route: "/governance/recurrence-schedules", operatorPageLead: RECURRENCE_SCHEDULES_PAGE_SUBTITLE },
  { route: "/governance/recurrence-schedules/", operatorPageLead: RECURRENCE_SCHEDULES_PAGE_SUBTITLE },
  { route: "/governance/setup", operatorPageLead: GOVERNANCE_SETUP_PAGE_SUBTITLE },
  { route: "/governance/setup", operatorPageLead: GOVERNANCE_OVERVIEW_PAGE_LEAD },
  { route: "/governance/setup/", operatorPageLead: GOVERNANCE_SETUP_PAGE_SUBTITLE },
  { route: "/governance/first-30-days", operatorPageLead: GOVERNANCE_SETUP_PAGE_SUBTITLE },
];
