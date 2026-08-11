/**
 * Customer-facing AWS cloud-connection permission contract.
 * Keep in sync with `HostedAwsExtractorClient` (Resource Explorer `Search`) and trust-center guidance.
 */
export const AWS_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION = "2026-08-09";

export type AwsPermissionRequirementLabel = "required" | "optional" | "conditional";

export function formatAwsPermissionRequirementLabel(label: AwsPermissionRequirementLabel): string {
  switch (label) {
    case "required":
      return "Required";
    case "optional":
      return "Optional";
    case "conditional":
      return "Conditional";
    default: {
      const exhaustive: never = label;

      return exhaustive;
    }
  }
}

export type AwsCloudConnectionPermissionRow = {
  readonly iamIdentifier: string;
  readonly requirement: AwsPermissionRequirementLabel;
  readonly purpose: string;
  readonly recommendedScope: string;
  readonly writeAccess: false;
};

export const AWS_CLOUD_CONNECTION_FORBIDDEN_POLICIES: readonly string[] = [
  "AdministratorAccess",
  "PowerUserAccess",
  "IAMFullAccess",
];

export const AWS_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS: readonly string[] = [
  "IAM trust policy issuer, subject, or audience does not match the federation identifiers on this page — confirm values from Assurance status.",
  "The read-only role ARN points to another AWS account or a misspelled role name.",
  "Resource Explorer does not have an aggregator index in the account and primary region used for the connection.",
  "AWSResourceExplorerReadOnlyAccess is not attached to the read-only IAM role ArchLucid assumes.",
  "An organization SCP or permission boundary blocks sts:AssumeRoleWithWebIdentity or resource-explorer-2:Search.",
  "IAM changes have not propagated yet — wait a few minutes and run Re-poll now again.",
];

export const AWS_CLOUD_CONNECTION_PERMISSION_ROWS: readonly AwsCloudConnectionPermissionRow[] = [
  {
    iamIdentifier: "resource-explorer-2:Search",
    requirement: "required",
    purpose: "Lists account resources through AWS Resource Explorer for architecture evidence.",
    recommendedScope: "Read-only IAM role used by the connection",
    writeAccess: false,
  },
  {
    iamIdentifier: "AWSResourceExplorerReadOnlyAccess",
    requirement: "required",
    purpose: "AWS managed policy that grants the Resource Explorer read APIs ArchLucid calls.",
    recommendedScope: "Attach to the read-only IAM role",
    writeAccess: false,
  },
  {
    iamIdentifier: "Resource Explorer index",
    requirement: "conditional",
    purpose:
      "Resource Explorer must have an aggregator index enabled in the account and primary region used for the connection before Search succeeds.",
    recommendedScope: "One-time operator setup in the AWS console or your IaC",
    writeAccess: false,
  },
];
