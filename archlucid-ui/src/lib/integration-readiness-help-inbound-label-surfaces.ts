import { INTEGRATION_READINESS_HELP_TOPIC_LABEL } from "@/lib/integration-readiness-help-evidence-copy";

/** TB-1690 — integration-readiness help routes share one inbound Learn-more label. */
export const INTEGRATION_READINESS_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/integration-readiness": INTEGRATION_READINESS_HELP_TOPIC_LABEL,
} as const;

export const INTEGRATION_READINESS_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-map.ts",
  "src/lib/contextual-help/integration-readiness-rows.ts",
] as const;
