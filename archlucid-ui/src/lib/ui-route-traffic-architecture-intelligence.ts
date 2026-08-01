import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture-intelligence-route";

/**
 * Traffic workbook row ID for Architecture intelligence.
 * Owner backlog shorthand: AR2.
 */
export const ARCHITECTURE_INTELLIGENCE_TRAFFIC_ROW_ID = "AIN";

/** Canonical path tracked on the AIN workbook row. */
export const ARCHITECTURE_INTELLIGENCE_TRAFFIC_PATH = ARCHITECTURE_INTELLIGENCE_PATH;

/** Workbook Section column value — core review workflow surface, not pre-login marketing. */
export const ARCHITECTURE_INTELLIGENCE_TRAFFIC_SECTION = "Core review";

/**
 * Owner workbook Notes for AIN/AR2 — documents the closed-loop reasoning operator hub.
 */
export const ARCHITECTURE_INTELLIGENCE_TRAFFIC_NOTE =
  "Closed-loop architecture reasoning operator surface - ArchitectureIntelligencePageClient runs reasoning/golden tests and publish-to-findings round trip. Deep links from reviews/findings via runId query. Canonical path /architecture-intelligence.";
