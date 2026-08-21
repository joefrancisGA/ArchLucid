import { SPONSOR_REPORT_HELP_TOPIC_LABEL } from "@/lib/sponsor/sponsor-report-help-evidence-copy";

/** TB-1690 — sponsor-report help routes must share one inbound Learn-more label. */
export const SPONSOR_REPORT_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/sponsor-report": SPONSOR_REPORT_HELP_TOPIC_LABEL,
  "/insights/sponsor-report": SPONSOR_REPORT_HELP_TOPIC_LABEL,
  "/sponsor-report": SPONSOR_REPORT_HELP_TOPIC_LABEL,
} as const;

export const SPONSOR_REPORT_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/contextual-help/help-topic-rows.ts",
] as const;
