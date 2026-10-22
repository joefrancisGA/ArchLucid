import { ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/engineering-troubleshooting-help-guide-content";

/** TB-2264 — product chrome must open canonical `/help/engineering-troubleshooting`, not the retired alias slug. */
export const ENGINEERING_TROUBLESHOOTING_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/engineering-troubleshooting": ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL,
} as const;

export const ENGINEERING_TROUBLESHOOTING_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/cli-usage-help-evidence-copy.ts",
  "src/lib/developer-settings-evidence-copy.ts",
  "src/lib/api-contracts-help-guide-content.ts",
  "src/lib/report-a-problem-help-evidence-copy.ts",
  "src/lib/admin-diagnostics-help-related-topics.ts",
  "src/lib/help/help-search-panel-catalog.ts",
] as const;

export const ENGINEERING_TROUBLESHOOTING_HELP_CANONICAL_HELP_HREF = "/help/engineering-troubleshooting" as const;
