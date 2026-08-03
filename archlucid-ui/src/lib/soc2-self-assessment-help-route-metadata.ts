import type { Metadata } from "next";

import {
  SOC2_SELF_ASSESSMENT_HELP_PAGE_SUBTITLE,
  SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE,
} from "@/lib/soc2-self-assessment-help-guide-content";

/**
 * Buyer SOC 2 self-assessment — diligence help, not a CPA attestation landing page.
 */
export const SOC2_SELF_ASSESSMENT_HELP_ROUTE_METADATA: Metadata = {
  title: SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE,
  description: SOC2_SELF_ASSESSMENT_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
