import { API_CONTRACTS_HELP_TOPIC_LABEL } from "@/lib/api-contracts-help-guide-content";

/** TB-2267 — product chrome must open canonical `/help/api-contracts`, not the retired alias slug. */
export const API_CONTRACTS_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/api-contracts": API_CONTRACTS_HELP_TOPIC_LABEL,
} as const;

export const API_CONTRACTS_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/vocabulary/developer-api-contracts-api-keys-vocabulary.ts",
  "src/lib/developer-settings-evidence-copy.ts",
  "src/lib/engineering-troubleshooting-help-guide-content.ts",
  "src/lib/in-app-doc-href.ts",
  "src/lib/help/help-search-panel-catalog.ts",
] as const;

export const API_CONTRACTS_HELP_CANONICAL_HELP_HREF = "/help/api-contracts" as const;
