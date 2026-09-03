/** Traffic workbook rows for the `help-topic` workbook section — thin registry over domain modules. */

import { HELP_TOPIC_TRAFFIC_ROWS_GOVERNANCE } from "@/lib/ui-route-traffic/help-topic-rows-governance";
import { HELP_TOPIC_TRAFFIC_ROWS_INTEGRATIONS } from "@/lib/ui-route-traffic/help-topic-rows-integrations";
import { HELP_TOPIC_TRAFFIC_ROWS_PILOT } from "@/lib/ui-route-traffic/help-topic-rows-pilot";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

export const HELP_TOPIC_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  ...HELP_TOPIC_TRAFFIC_ROWS_GOVERNANCE,
  ...HELP_TOPIC_TRAFFIC_ROWS_INTEGRATIONS,
  ...HELP_TOPIC_TRAFFIC_ROWS_PILOT,
];
