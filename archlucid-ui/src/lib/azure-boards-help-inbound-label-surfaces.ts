import { AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/azure-boards-integration-evidence-copy";

/** TB-1759 — Azure Boards product chrome must open canonical `/help/azure-boards`, not the retired alias slug. */
export const AZURE_BOARDS_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/azure-boards": AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL,
  "/integrations/azure-boards": AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL,
} as const;

export const AZURE_BOARDS_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/azure-boards-page-copy.ts",
  "src/app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationAside.tsx",
] as const;

export const AZURE_BOARDS_HELP_CANONICAL_HELP_HREF = "/help/azure-boards" as const;
