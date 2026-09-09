export const GCP_CLOUD_CONNECTION_PRIMARY_CONTENT_ID = "gcp-cloud-connection-primary-content" as const;

export const GCP_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID = "gcp-cloud-connection-first-viewport" as const;

export const GCP_CLOUD_CONNECTION_SKIP_TARGET_ID = GCP_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID;

export const GCP_CLOUD_CONNECTION_SKIP_LINK_LABEL = "Skip to GCP connection workspace" as const;

export const GCP_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "gcp-cloud-connection-header-claim-discipline" as const;

export const GCP_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID = "gcp-cloud-connection-orientation-bottom" as const;

export const GCP_CLOUD_CONNECTION_WORKSPACE_TEST_ID = "gcp-cloud-connection-workspace" as const;

export const GCP_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER =
  "Configure read-only GCP inventory through Workload Identity Federation — review the security preflight, copy the WIF starter, then save and validate your connection." as const;

export const GCP_CLOUD_CONNECTION_START_HERE_CARD_TITLE = "Start here" as const;

export const GCP_CLOUD_CONNECTION_START_HERE_LEAD =
  "Complete the security preflight checklist, copy the Workload Identity Federation starter into GCP, then enter your project details in Connection details and validate." as const;

export const GCP_CLOUD_CONNECTION_PAGE_LEAD =
  "Connect read-only GCP inventory through Workload Identity Federation — no downloadable service-account JSON keys." as const;

export const GCP_CLOUD_CONNECTION_BUYER_OVERVIEW =
  "Use the start-here checklist above for security preflight and Workload Identity Federation setup, then complete connection details and validation below before treating inventory as authoritative." as const;

export function gcpCloudConnectionPageOverview(
  buyerPolishedShell: boolean,
  operatorOverview: string,
): string {
  return buyerPolishedShell ? GCP_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER : operatorOverview;
}
