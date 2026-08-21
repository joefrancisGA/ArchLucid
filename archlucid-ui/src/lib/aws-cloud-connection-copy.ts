/** Operator-facing copy for `/integrations/cloud-connections/aws` (TB-1762, TB-1763). */

export const AWS_CLOUD_CONNECTION_BANNED_COPY = [
  "Evidence tier",
  "Tier 1",
  "Tier 2",
  "hosted pull",
  "hosted poll",
  "Hosted AWS poll",
  "validation pull",
  "hosted inventory pull",
  "hosted inventory package",
] as const;

export const AWS_CONNECTION_COLLECTION_FAILED_ERROR =
  "Inventory collection failed. Confirm OIDC federation and the read-only IAM role can access Resource Explorer.";

export const AWS_CONNECTION_LOAD_FAILED_ERROR =
  "Could not load AWS connections. Check your permissions and try again.";

export const AWS_CONNECTION_SAVE_FAILED_ERROR =
  "Could not save the AWS connection. Verify the role ARN and try again.";

export const AWS_CONNECTION_DISCONNECT_FAILED_ERROR = "Could not disconnect the AWS connection.";

export const AWS_CONNECTION_VALIDATE_EMPTY_STATE =
  "Save an AWS connection in Connection details before validating access.";

export const AWS_CONNECTION_VALIDATE_CONNECTED_LEAD =
  "Re-poll now in Connection details validates OIDC federation access and imports a fresh Resource Explorer inventory package.";

export const AWS_CONNECTION_ACCOUNT_ID_LABEL = "AWS account ID";

export const AWS_CONNECTION_ACCOUNT_ID_HINT =
  "12-digit AWS account that owns the read-only IAM role.";

export const AWS_CONNECTION_REGION_LABEL = "Primary region";

export const AWS_CONNECTION_REGION_HINT =
  "AWS region Resource Explorer uses for inventory collection.";

export const AWS_CONNECTION_ROLE_ARN_LABEL = "Read-only IAM role ARN";

export const AWS_CONNECTION_ROLE_ARN_HINT =
  "ARN of the read-only IAM role that trusts ArchLucid through OIDC. ArchLucid does not store access keys.";

export const AWS_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE =
  "Save a connection and run Re-poll now to import inventory.";

export function formatAwsConnectionCollectionSuccessMessage(
  resourceCount: number,
  packageId: string,
): string {
  return `Collection completed (${resourceCount} resources imported as package ${packageId}).`;
}
