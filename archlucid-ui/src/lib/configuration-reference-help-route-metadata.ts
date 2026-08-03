import type { Metadata } from "next";

import {
  CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE,
  CONFIGURATION_REFERENCE_HELP_PAGE_TITLE,
} from "@/lib/configuration-reference-help-guide-content";

/**
 * Admin configuration task guide — operator help, not a marketing landing page.
 */
export const CONFIGURATION_REFERENCE_HELP_ROUTE_METADATA: Metadata = {
  title: CONFIGURATION_REFERENCE_HELP_PAGE_TITLE,
  description: CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
