import type { Metadata } from "next";

import {

  GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE,

  GOVERNANCE_APPROVAL_HELP_PAGE_TITLE,

} from "@/lib/governance/governance-approval-help-guide-content";

/**

 * Specialty governance approval guide — operator help, not a marketing landing page.

 */

export const GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA: Metadata = {

  title: GOVERNANCE_APPROVAL_HELP_PAGE_TITLE,

  description: GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE,

  robots: { index: false, follow: false },

};

