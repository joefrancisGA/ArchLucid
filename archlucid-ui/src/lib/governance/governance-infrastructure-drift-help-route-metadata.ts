import type { Metadata } from "next";

import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-drift-help-guide-content";

/** Drift and snapshots specialty guide — operator help, not a marketing landing page. */
export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_ROUTE_METADATA: Metadata = {
  title: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE,
  description: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
