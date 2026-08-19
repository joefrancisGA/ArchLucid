import type { Metadata } from "next";

import {
  BILLING_HELP_PAGE_SUBTITLE_OPERATOR,
  BILLING_HELP_PAGE_TITLE,
} from "@/lib/billing-help-guide-content";

/**
 * Specialty billing orientation guide — operator help, not a marketing landing page.
 */
export const BILLING_AND_PLANS_HELP_ROUTE_METADATA: Metadata = {
  title: BILLING_HELP_PAGE_TITLE,
  description: BILLING_HELP_PAGE_SUBTITLE_OPERATOR,
  robots: { index: false, follow: false },
};
