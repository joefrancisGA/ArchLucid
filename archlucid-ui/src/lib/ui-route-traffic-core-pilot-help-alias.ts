import {
  FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  LEGACY_CORE_PILOT_HELP_PATH,
} from "@/lib/first-architecture-review-help-route";

/**
 * Traffic workbook row ID for the legacy Core Pilot help bookmark.
 * Owner backlog shorthand: ECO.
 */
export const CORE_PILOT_HELP_ALIAS_TRAFFIC_ROW_ID = "ECO";

/** Legacy alias path tracked on the ECO workbook row. */
export const CORE_PILOT_HELP_ALIAS_TRAFFIC_PATH = LEGACY_CORE_PILOT_HELP_PATH;

/** Canonical first-review help path that ECO resolves to (workbook row HCO). */
export const CORE_PILOT_HELP_ALIAS_CANONICAL_PATH = FIRST_ARCHITECTURE_REVIEW_HELP_PATH;

/** Workbook Section column value — deprecated help alias, not a separate topic. */
export const CORE_PILOT_HELP_ALIAS_TRAFFIC_SECTION = "Help alias";

/**
 * Owner workbook Notes for ECO — documents the legacy slug alias bookmark.
 */
export const CORE_PILOT_HELP_ALIAS_TRAFFIC_NOTE =
  "Deprecated operator bookmark — merged to Your first architecture review on **HCO** (`/help/first-architecture-review`). Slug alias `core-pilot` → `first-architecture-review` in HELP_TOPIC_SLUG_ALIASES; catalog migration merges workbook Hit% onto HCO.";
