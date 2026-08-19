import type { Metadata } from "next";

import {
  PATH_CHOOSER_HELP_PAGE_SUBTITLE,
  PATH_CHOOSER_HELP_PAGE_TITLE,
} from "@/lib/path-chooser-help-guide-content";

/**
 * Buyer path chooser — operator help, not a marketing landing page.
 */
export const PATH_CHOOSER_HELP_ROUTE_METADATA: Metadata = {
  title: PATH_CHOOSER_HELP_PAGE_TITLE,
  description: PATH_CHOOSER_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
