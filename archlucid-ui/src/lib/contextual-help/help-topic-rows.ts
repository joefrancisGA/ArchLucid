/** Long-form help topics (`/help/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

import { HELP_TOPIC_CONTEXTUAL_HELP_ROWS_GOVERNANCE } from "./help-topic-rows-governance";
import { HELP_TOPIC_CONTEXTUAL_HELP_ROWS_INTEGRATIONS } from "./help-topic-rows-integrations";
import { HELP_TOPIC_CONTEXTUAL_HELP_ROWS_OPERATOR } from "./help-topic-rows-operator";

export const HELP_TOPIC_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  ...HELP_TOPIC_CONTEXTUAL_HELP_ROWS_GOVERNANCE,
  ...HELP_TOPIC_CONTEXTUAL_HELP_ROWS_OPERATOR,
  ...HELP_TOPIC_CONTEXTUAL_HELP_ROWS_INTEGRATIONS,
];
