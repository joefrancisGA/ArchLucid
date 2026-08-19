import type { Metadata } from "next";

import {
  FIRST_VALUE_20_HELP_PAGE_SUBTITLE,
  FIRST_VALUE_20_HELP_PAGE_TITLE,
} from "@/lib/first-value-20-help-guide-content";

/**
 * Admin-gated 20-minute SE runbook — not a customer help topic or marketing page.
 * `generateMetadata` intentionally returns a not-found title for internal-runbook slugs.
 */
export const FIRST_VALUE_20_HELP_ROUTE_METADATA: Metadata = {
  title: FIRST_VALUE_20_HELP_PAGE_TITLE,
  description: FIRST_VALUE_20_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
