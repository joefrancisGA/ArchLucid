import type { Metadata } from "next";

import {
  SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR,
  SPONSOR_SUMMARY_HELP_PAGE_TITLE,
} from "@/lib/sponsor/sponsor-report-help-guide-content";

/**
 * Specialty sponsor report guide — buyer help, not a marketing landing page.
 */
export const SPONSOR_SUMMARY_HELP_ROUTE_METADATA: Metadata = {
  title: SPONSOR_SUMMARY_HELP_PAGE_TITLE,
  description: SPONSOR_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR,
  robots: { index: false, follow: false },
};
