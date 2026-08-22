import { PILOT_FEEDBACK_HELP_TOPIC_LABEL } from "@/lib/pilot-feedback-help-evidence-copy";

/** TB-1716 — pilot-feedback help routes share one inbound Learn-more label. */
export const PILOT_FEEDBACK_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/pilot-feedback": PILOT_FEEDBACK_HELP_TOPIC_LABEL,
  "/internal/product-learning": PILOT_FEEDBACK_HELP_TOPIC_LABEL,
} as const;

export const PILOT_FEEDBACK_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/contextual-help/help-topic-rows.ts",
] as const;
