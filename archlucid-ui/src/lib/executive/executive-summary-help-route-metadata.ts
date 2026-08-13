import type { Metadata } from "next";

import {
  EXECUTIVE_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR,
  EXECUTIVE_SUMMARY_HELP_PAGE_TITLE,
} from "@/lib/executive/executive-summary-help-guide-content";

/**
 * Specialty executive summary guide — buyer help, not a marketing landing page.
 */
export const EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA: Metadata = {
  title: EXECUTIVE_SUMMARY_HELP_PAGE_TITLE,
  description: EXECUTIVE_SUMMARY_HELP_PAGE_SUBTITLE_OPERATOR,
  robots: { index: false, follow: false },
};
