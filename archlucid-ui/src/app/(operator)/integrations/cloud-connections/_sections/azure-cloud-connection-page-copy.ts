export const AZURE_CLOUD_CONNECTION_PRIMARY_CONTENT_ID = "azure-cloud-connection-primary-content" as const;

export const AZURE_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID = "azure-cloud-connection-first-viewport" as const;

export const AZURE_CLOUD_CONNECTION_SKIP_TARGET_ID = AZURE_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID;

export const AZURE_CLOUD_CONNECTION_SKIP_LINK_LABEL = "Skip to Azure connection workspace" as const;

export const AZURE_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "azure-cloud-connection-header-claim-discipline" as const;

export const AZURE_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID = "azure-cloud-connection-orientation-bottom" as const;

export const AZURE_CLOUD_CONNECTION_WORKSPACE_TEST_ID = "azure-cloud-connection-workspace" as const;

export const AZURE_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER =
  "Configure read-only Azure inventory through a federated service principal — review the security preflight, provision identity access, then save and validate your connection." as const;

export const AZURE_CLOUD_CONNECTION_START_HERE_CARD_TITLE = "Start here" as const;

export const AZURE_CLOUD_CONNECTION_START_HERE_LEAD =
  "Complete the security preflight checklist, provision federated credentials for your service principal, then configure subscriptions in Connection details and validate." as const;

export const AZURE_CLOUD_CONNECTION_PAGE_LEAD =
  "Connect read-only Azure inventory through a federated service principal — no client secrets stored." as const;

export const AZURE_CLOUD_CONNECTION_BUYER_OVERVIEW =
  "Use the start-here checklist above for security preflight and federated credential setup, then complete connection details and validation below before treating inventory as authoritative." as const;

export function azureCloudConnectionPageOverview(
  buyerPolishedShell: boolean,
  operatorOverview: string,
): string {
  return buyerPolishedShell ? AZURE_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER : operatorOverview;
}
