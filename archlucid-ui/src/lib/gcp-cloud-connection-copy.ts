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

export const GCP_CONNECTION_VALIDATE_EMPTY_STATE =
  "Save a GCP connection in Connection details before validating access.";

export const GCP_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE =
  "No collection activity yet. Save a connection and run Re-poll now to import inventory.";

export function formatGcpConnectionCollectionSuccessMessage(
  resourceCount: number,
  packageId: string,
): string {
  return `Collection completed (${resourceCount} resources imported as package ${packageId}).`;
}
