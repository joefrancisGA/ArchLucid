import type { Metadata } from "next";

import {
  FLEET_LLM_COGS_PAGE_LEAD,
  FLEET_LLM_COGS_PAGE_TITLE,
} from "@/lib/fleet-llm-cogs-page-copy";

/**
 * Fleet LLM COGS is a platform-admin operational surface — not a marketing page.
 */
export const FLEET_LLM_COGS_ROUTE_METADATA: Metadata = {
  title: FLEET_LLM_COGS_PAGE_TITLE,
  description: FLEET_LLM_COGS_PAGE_LEAD,
  robots: { index: false, follow: false },
};
