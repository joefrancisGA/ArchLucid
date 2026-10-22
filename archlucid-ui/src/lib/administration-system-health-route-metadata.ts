import type { Metadata } from "next";

import {
  SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR,
  SYSTEM_HEALTH_PAGE_TITLE,
} from "@/lib/system-health-page-copy";

/**
 * Administration System health hub — tenant operational readiness (not a marketing page).
 */
export const ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA: Metadata = {
  title: SYSTEM_HEALTH_PAGE_TITLE,
  description: SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR,
  robots: { index: false, follow: false },
};
