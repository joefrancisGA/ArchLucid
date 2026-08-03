import type { Metadata } from "next";

import {
  DPA_TEMPLATE_HELP_PAGE_SUBTITLE,
  DPA_TEMPLATE_HELP_PAGE_TITLE,
} from "@/lib/dpa-template-help-guide-content";

/**
 * Buyer DPA negotiation template — diligence help, not a marketing landing page.
 */
export const DPA_TEMPLATE_HELP_ROUTE_METADATA: Metadata = {
  title: DPA_TEMPLATE_HELP_PAGE_TITLE,
  description: DPA_TEMPLATE_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
