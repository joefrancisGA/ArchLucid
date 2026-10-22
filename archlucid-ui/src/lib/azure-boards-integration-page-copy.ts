export const AZURE_BOARDS_INTEGRATION_PRIMARY_CONTENT_ID = "azure-boards-integration-primary-content" as const;

export const AZURE_BOARDS_INTEGRATION_FIRST_VIEWPORT_TEST_ID = "azure-boards-integration-first-viewport" as const;

export const AZURE_BOARDS_INTEGRATION_SKIP_TARGET_ID = AZURE_BOARDS_INTEGRATION_FIRST_VIEWPORT_TEST_ID;

export const AZURE_BOARDS_INTEGRATION_SKIP_LINK_LABEL = "Skip to Azure Boards workspace" as const;

export const AZURE_BOARDS_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "azure-boards-integration-header-claim-discipline" as const;

export const AZURE_BOARDS_INTEGRATION_PAGE_SUBTITLE_BUYER =
  "Connect your Azure DevOps organization, save default work item behavior, and verify connectivity before creating items from findings." as const;

export function azureBoardsIntegrationPageSubtitle(buyerPolishedShell: boolean, operatorSubtitle: string): string {
  return buyerPolishedShell ? AZURE_BOARDS_INTEGRATION_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
