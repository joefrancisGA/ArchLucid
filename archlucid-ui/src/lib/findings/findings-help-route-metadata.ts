import type { Metadata } from "next";

import {

  FINDINGS_HELP_PAGE_SUBTITLE,

  FINDINGS_HELP_PAGE_TITLE,

} from "@/lib/findings/findings-help-guide-content";

/**

 * Specialty findings guide — operator help, not a marketing landing page.

 */

export const FINDINGS_HELP_ROUTE_METADATA: Metadata = {

  title: FINDINGS_HELP_PAGE_TITLE,

  description: FINDINGS_HELP_PAGE_SUBTITLE,

  robots: { index: false, follow: false },

};

