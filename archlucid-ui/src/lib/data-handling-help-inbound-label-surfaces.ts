import { DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";

/** TB-1651 — data-handling help routes share one inbound Learn-more label. */
export const DATA_HANDLING_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/data-handling": DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL,
} as const;

export const DATA_HANDLING_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-map.ts",
  "src/lib/contextual-help/help-topic-rows.ts",
] as const;
