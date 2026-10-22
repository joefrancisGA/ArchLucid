import type { Metadata } from "next";

import {
  FIRST_REVIEW_HELP_PAGE_SUBTITLE,
  FIRST_REVIEW_HELP_PAGE_TITLE,
} from "@/lib/first-review-help-guide-content";

/**
 * Admin SE first-run evidence checklist — operator help, not a marketing landing page.
 */
export const FIRST_REVIEW_HELP_ROUTE_METADATA: Metadata = {
  title: FIRST_REVIEW_HELP_PAGE_TITLE,
  description: FIRST_REVIEW_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
