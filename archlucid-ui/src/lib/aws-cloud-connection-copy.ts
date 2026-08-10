/** Operator-facing copy for `/integrations/cloud-connections/aws` validate/activity panels (TB-1762). */

export const AWS_CONNECTION_COLLECTION_FAILED_ERROR =
  "Inventory collection failed. Confirm OIDC federation and the read-only IAM role can access Resource Explorer.";

export const AWS_CONNECTION_VALIDATE_EMPTY_STATE =
  "Save an AWS connection in Connection details before validating access.";

export const AWS_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE =
  "No collection activity yet. Save a connection and run Re-poll now to import inventory.";

export function formatAwsConnectionCollectionSuccessMessage(
  resourceCount: number,
  packageId: string,
): string {
  return `Collection completed (${resourceCount} resources imported as package ${packageId}).`;
}
