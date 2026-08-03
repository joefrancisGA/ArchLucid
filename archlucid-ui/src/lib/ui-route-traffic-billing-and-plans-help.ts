import {
  BILLING_AND_PLANS_HELP_PATH,
  SETTINGS_BILLING_PATH,
} from "@/lib/billing-and-plans-help-route";

/**
 * Traffic workbook row ID for Billing and plans help.
 * Owner backlog shorthand: HBX.
 */
export const BILLING_AND_PLANS_HELP_TRAFFIC_ROW_ID = "HBX";

/** Canonical path tracked on the HBX workbook row. */
export const BILLING_AND_PLANS_HELP_TRAFFIC_PATH = BILLING_AND_PLANS_HELP_PATH;

/** Workbook Section column value - in-app help topic, not marketing. */
export const BILLING_AND_PLANS_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for HBX - documents the specialty HelpBillingAndPlansGuideView surface.
 */
export const BILLING_AND_PLANS_HELP_TRAFFIC_NOTE =
  "Specialty billing orientation guide - HelpBillingAndPlansGuideView with current-plan card, how-billing-works steps, FAQ, and CTAs to /administration/settings/billing (SBE) and /pricing. Not bare HelpTopicMarkdownView.";

/** Product billing settings path referenced from HBX handoffs (workbook row SBE). */
export const BILLING_AND_PLANS_HELP_SETTINGS_BILLING_PATH = SETTINGS_BILLING_PATH;
