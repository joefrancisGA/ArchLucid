/** Operator-facing copy for `/integrations/cloud-connections/gcp` (TB-1774). */

export const GCP_CLOUD_CONNECTION_BANNED_COPY = [
  "Evidence tier",
  "Tier 1",
  "Tier 2",
  "hosted pull",
  "hosted poll",
  "Hosted GCP poll",
  "validation pull",
  "hosted inventory pull",
  "hosted inventory package",
] as const;

export const GCP_CONNECTION_COLLECTION_FAILED_ERROR =
  "Inventory collection failed. Confirm Workload Identity Federation is configured and the service account can read Cloud Asset Inventory.";

export const GCP_CONNECTION_DISCONNECT_FAILED_ERROR = "Could not disconnect the GCP connection.";

export const GCP_CONNECTION_SAVE_FAILED_ERROR =
  "Could not save the GCP connection. Verify the Workload Identity Federation binding and try again.";

export const GCP_CONNECTION_VALIDATE_EMPTY_STATE =
  "Save a GCP connection in Connection details before validating access.";

export const GCP_CONNECTION_PROJECT_ID_LABEL = "GCP project ID";

export const GCP_CONNECTION_PROJECT_ID_HINT =
  "GCP project that Cloud Asset Inventory will scan for this connection.";

export const GCP_CONNECTION_POOL_PROVIDER_LABEL = "Workload Identity Pool provider";

export const GCP_CONNECTION_POOL_PROVIDER_HINT =
  "Full Workload Identity Pool provider resource name from Identity and access setup.";

export const GCP_CONNECTION_SERVICE_ACCOUNT_LABEL = "Read-only service account email";

export const GCP_CONNECTION_SERVICE_ACCOUNT_HINT =
  "Email of the read-only service account bound to ArchLucid through Workload Identity Federation.";

export const GCP_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE =
  "Save a connection and run Re-poll now to import inventory.";

export function formatGcpConnectionCollectionSuccessMessage(
  resourceCount: number,
  packageId: string,
): string {
  return `Collection completed (${resourceCount} resources imported as package ${packageId}).`;
}
