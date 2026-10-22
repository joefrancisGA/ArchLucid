import { COMPARISON_REPLAY_HELP_TOPIC_LABEL } from "@/lib/comparison-replay-help-evidence-copy";

/** TB-1640 — compare/replay workspace routes must share one inbound Learn-more label. */
export const COMPARISON_REPLAY_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/comparison-replay": COMPARISON_REPLAY_HELP_TOPIC_LABEL,
  "/insights/compare-two-reviews": COMPARISON_REPLAY_HELP_TOPIC_LABEL,
  "/replay": COMPARISON_REPLAY_HELP_TOPIC_LABEL,
  "/internal/replay": COMPARISON_REPLAY_HELP_TOPIC_LABEL,
  "/internal/validate-route": COMPARISON_REPLAY_HELP_TOPIC_LABEL,
} as const;

export const COMPARISON_REPLAY_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/contextual-help/comparison-replay-rows.ts",
] as const;
