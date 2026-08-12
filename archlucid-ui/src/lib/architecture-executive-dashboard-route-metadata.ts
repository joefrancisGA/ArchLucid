import type { Metadata } from "next";

import {
  EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
  EXECUTIVE_DASHBOARD_PAGE_TITLE,
} from "@/lib/executive/executive-dashboard-page-copy";

/**
 * Canonical executive ROI portfolio dashboard — operator workspace surface (not marketing).
 */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_ROUTE_METADATA: Metadata = {
  title: EXECUTIVE_DASHBOARD_PAGE_TITLE,
  description: EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
  robots: { index: false, follow: false },
};
