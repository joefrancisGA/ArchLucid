import { FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-first-architecture-review-help";

/**
 * Removed traffic workbook row ID for the retired `/help/evidence-only-review` alias (merged into COR).
 * Do not reintroduce — first-architecture-review help is scored only on COR.
 */
export const REMOVED_EVIDENCE_ONLY_REVIEW_HELP_ALIAS_TRAFFIC_ROW_ID = "HEV";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_EVIDENCE_ONLY_REVIEW_HELP_ALIAS_TRAFFIC_PATH = "/help/evidence-only-review";

/** Canonical first-architecture-review help scored on traffic row COR. */
export const CANONICAL_FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH_FROM_EVIDENCE_ONLY =
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH;
