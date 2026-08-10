import type { Metadata } from "next";

import {
  ACCELERATOR_CHOOSER_HELP_PAGE_SUBTITLE,
  ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
} from "@/lib/accelerator-chooser-help-guide-content";

/**
 * Accelerator pack chooser — operator help, not a marketing landing page.
 */
export const ACCELERATOR_CHOOSER_HELP_ROUTE_METADATA: Metadata = {
  title: ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
  description: ACCELERATOR_CHOOSER_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
