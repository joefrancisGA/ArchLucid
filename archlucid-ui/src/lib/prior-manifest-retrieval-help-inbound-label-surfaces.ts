import { PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL } from "@/lib/prior-manifest-retrieval-help-evidence-copy";

/** TB-1732 / TB-1735 — Ask hub and finalize success share one inbound label. */
export const PRIOR_MANIFEST_RETRIEVAL_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/insights/ask-review-questions": PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL,
} as const;

export const PRIOR_MANIFEST_RETRIEVAL_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/contextual-help/prior-manifest-retrieval-rows.ts",
] as const;

export const PRIOR_MANIFEST_RETRIEVAL_HELP_FINALIZE_SUCCESS_LINK_LABEL = "Ask memory guide" as const;
