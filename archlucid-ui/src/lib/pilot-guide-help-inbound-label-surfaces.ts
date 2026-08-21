import { PILOT_GUIDE_HELP_TOPIC_LABEL } from "@/lib/pilot-guide-help-evidence-copy";

/** TB-1721 — pilot-guide help routes share one inbound Learn-more label. */
export const PILOT_GUIDE_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/pilot-guide": PILOT_GUIDE_HELP_TOPIC_LABEL,
} as const;

export const PILOT_GUIDE_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/contextual-help/help-topic-rows.ts",
] as const;
