import { PATH_CHOOSER_HELP_TOPIC_LABEL } from "@/lib/path-chooser-help-evidence-copy";

/** TB-1715 — choose-your-next-step help routes share one inbound Learn-more label. */
export const PATH_CHOOSER_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/choose-your-next-step": PATH_CHOOSER_HELP_TOPIC_LABEL,
} as const;

export const PATH_CHOOSER_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/contextual-help/help-topic-rows.ts",
] as const;
