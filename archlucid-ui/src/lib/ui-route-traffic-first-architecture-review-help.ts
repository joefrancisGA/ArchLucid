import {
  FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  LEGACY_CORE_PILOT_HELP_PATH,
} from "@/lib/first-architecture-review-help-route";

/**
 * Traffic workbook row ID for Your first architecture review help.
 * Owner backlog shorthand: HCO.
 */
export const FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_ROW_ID = "HCO";

/** Canonical path tracked on the HCO workbook row. */
export const FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH = FIRST_ARCHITECTURE_REVIEW_HELP_PATH;

/** Workbook Section column value - in-app help topic, not marketing. */
export const FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for HCO - documents the specialty HelpCorePilotGuideView surface.
 */
export const FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_NOTE =
  "Specialty first-review guide - HelpCorePilotGuideView with hero Start review CTA, five-step stepper, and gated finalize steps (TB-1040). Legacy alias /help/core-pilot resolves to this slug. Not bare HelpTopicMarkdownView.";

/** Alias path tracked separately as Help alias when present in the workbook. */
export const LEGACY_CORE_PILOT_HELP_TRAFFIC_ALIAS_PATH = LEGACY_CORE_PILOT_HELP_PATH;
