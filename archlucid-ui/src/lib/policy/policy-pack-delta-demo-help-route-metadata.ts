import type { Metadata } from "next";

import {
  POLICY_PACK_DELTA_DEMO_HELP_PAGE_SUBTITLE,
  POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE,
} from "@/lib/policy/policy-pack-delta-demo-help-guide-content";

/**
 * Internal SE/Admin policy-pack delta demo — operator help, not a marketing landing page.
 */
export const POLICY_PACK_DELTA_DEMO_HELP_ROUTE_METADATA: Metadata = {
  title: POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE,
  description: POLICY_PACK_DELTA_DEMO_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
