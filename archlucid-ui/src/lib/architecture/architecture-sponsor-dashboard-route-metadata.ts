import type { Metadata } from "next";

import {
  SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
  SPONSOR_DASHBOARD_PAGE_TITLE,
} from "@/lib/sponsor-dashboard-page-copy";

/**
 * Canonical sponsor ROI portfolio dashboard — operator workspace surface (not marketing).
 */
export const ARCHITECTURE_SPONSOR_DASHBOARD_ROUTE_METADATA: Metadata = {
  title: SPONSOR_DASHBOARD_PAGE_TITLE,
  description: SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
  robots: { index: false, follow: false },
};
