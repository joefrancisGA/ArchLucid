/**
 * Operator route prefixes and inbound labels for contextual help.
 * Lookup lives in page-help-topic-map.ts so this file stays a data leaf.
 */

import { PAGE_HELP_TOPIC_ROWS_ADMIN_COMPOSE } from "./page-help-topic-rows-admin-compose";
import { PAGE_HELP_TOPIC_ROWS_ADMIN_INTEGRATIONS } from "./page-help-topic-rows-admin-integrations";
import { PAGE_HELP_TOPIC_ROWS_ADMIN_SECURITY } from "./page-help-topic-rows-admin-security";

export const PAGE_HELP_TOPIC_ROWS_ADMIN: readonly {
  prefix: string;
  topic: import("./page-help-topic-rows-operator").PageHelpTopic;
}[] = [
  ...PAGE_HELP_TOPIC_ROWS_ADMIN_COMPOSE,
  ...PAGE_HELP_TOPIC_ROWS_ADMIN_SECURITY,
  ...PAGE_HELP_TOPIC_ROWS_ADMIN_INTEGRATIONS,
];
