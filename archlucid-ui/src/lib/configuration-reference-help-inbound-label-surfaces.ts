import { CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL } from "@/lib/configuration-reference-help-guide-content";

/** TB-2270 — product chrome must open canonical `/help/configuration-reference`, not retired identity alias slugs. */
export const CONFIGURATION_REFERENCE_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/configuration-reference": CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL,
} as const;

export const CONFIGURATION_REFERENCE_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-map.ts",
  "src/lib/admin-configuration-evidence-copy.ts",
  "src/lib/in-app-doc-href.ts",
  "src/lib/api-contracts-help-ia-dual.ts",
] as const;

export const CONFIGURATION_REFERENCE_HELP_CANONICAL_HELP_HREF = "/help/configuration-reference" as const;
