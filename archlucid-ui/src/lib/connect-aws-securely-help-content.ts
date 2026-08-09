/**
 * Customer-facing copy for `/help/cloud-connections/aws`.
 * Permission rows reuse `aws-cloud-connection-permissions-manifest.ts`.
 */
export const CONNECT_AWS_SECURELY_PAGE_TITLE = "Connect AWS securely";

export const CONNECT_AWS_SECURELY_PAGE_INTRO =
  "ArchLucid can use AWS resource inventory when you connect an AWS account. The AWS connection is optional; reviews can also use briefs, diagrams, documents, and uploaded inventory.";

export const CONNECT_AWS_SECURELY_CONNECTION_VALUE =
  "Connecting AWS adds current Resource Explorer inventory to reviews. ArchLucid can still review uploaded documents and diagrams without a cloud connection.";

export const CONNECT_AWS_SECURELY_OPTIONAL_ZIP_NOTE =
  "You can also export a read-only inventory ZIP from your AWS account with your own operator credentials and upload it from the New architecture review wizard. ArchLucid never receives your AWS access keys.";

export const CONNECT_AWS_SECURELY_BACK_TO_CONNECTIONS = "Back to cloud connections";

export const CONNECT_AWS_SECURELY_CONFIGURE_ACTION = "Configure AWS connection";

export const CONNECT_AWS_SECURELY_SECURITY_HEADING = "Security model";

export const CONNECT_AWS_SECURELY_SECURITY_ITEMS = [
  {
    id: "oidc-federation",
    title: "OIDC web identity federation",
    detail: "ArchLucid assumes your read-only IAM role at runtime through OIDC federation without storing access keys.",
  },
  {
    id: "read-only",
    title: "Read-only inventory",
    detail: "ArchLucid requests only Resource Explorer read APIs needed to collect architecture evidence.",
  },
  {
    id: "account-scoped",
    title: "Account-scoped role",
    detail: "You provision the IAM role in your AWS account and can revoke the trust policy at any time.",
  },
  {
    id: "customer-controlled",
    title: "Customer-controlled access",
    detail: "Your AWS administrator controls the IAM role, trust policy, and permission boundaries.",
  },
] as const;

export const CONNECT_AWS_SECURELY_SETUP_HEADING = "Set up the AWS connection";

export const CONNECT_AWS_SECURELY_SETUP_STEPS = [
  {
    id: "open-cloud-connections",
    text: "Open Cloud connections and begin an AWS connection.",
  },
  {
    id: "complete-security-review",
    text: "Complete the in-product security review checklist on the AWS connection page.",
  },
  {
    id: "configure-trust",
    text: "Create a read-only IAM role with an OIDC trust policy for ArchLucid's federated identity (identifiers and template below).",
  },
  {
    id: "enter-connection-details",
    text: "Enter your 12-digit AWS account ID, primary region, and read-only role ARN.",
  },
  {
    id: "verify",
    text: "Save the connection, then run Re-poll now to confirm federated assume-role and inventory access.",
  },
] as const;

export const CONNECT_AWS_SECURELY_FEDERATION_HEADING = "Federation identifiers";

export const CONNECT_AWS_SECURELY_FEDERATION_INTRO =
  "Bind your IAM OIDC identity provider and role trust policy to ArchLucid's hosted Azure user-assigned managed identity. Obtain the current tenant ID and managed identity object ID from Assurance status or the in-product AWS connection security review when values are environment-specific.";

export type ConnectAwsSecurelyFederationIdentifier = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly isPlaceholder: boolean;
};

export const CONNECT_AWS_SECURELY_FEDERATION_IDENTIFIERS: readonly ConnectAwsSecurelyFederationIdentifier[] = [
  {
    id: "issuer",
    label: "OIDC issuer (Entra ID)",
    value: "https://login.microsoftonline.com/{ArchLucid tenant ID}/v2.0",
    isPlaceholder: true,
  },
  {
    id: "audience",
    label: "Token audience",
    value: "api://AzureADTokenExchange",
    isPlaceholder: false,
  },
  {
    id: "subject",
    label: "Subject (managed identity object ID)",
    value: "{ArchLucid managed identity object ID}",
    isPlaceholder: true,
  },
  {
    id: "oidc-provider-arn",
    label: "IAM OIDC provider ARN (example)",
    value: "arn:aws:iam::{your AWS account ID}:oidc-provider/sts.windows.net/{ArchLucid tenant ID}",
    isPlaceholder: true,
  },
] as const;

export const CONNECT_AWS_SECURELY_TRUST_POLICY_HEADING = "IAM trust policy template";

export const CONNECT_AWS_SECURELY_TRUST_POLICY_INTRO =
  "Use this AssumeRoleWithWebIdentity trust policy on your read-only IAM role. Replace placeholder values before applying it in AWS.";

export const CONNECT_AWS_SECURELY_TRUST_POLICY_REPLACE_HINT =
  "Replace {your AWS account ID}, {ArchLucid tenant ID}, and {ArchLucid managed identity object ID} with your values. Create the IAM OIDC provider in your account before attaching this trust policy.";

export function buildAwsCloudConnectionTrustPolicyTemplate(): string {
  return `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::{your AWS account ID}:oidc-provider/sts.windows.net/{ArchLucid tenant ID}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "sts.windows.net/{ArchLucid tenant ID}:aud": "api://AzureADTokenExchange",
          "sts.windows.net/{ArchLucid tenant ID}:sub": "{ArchLucid managed identity object ID}"
        }
      }
    }
  ]
}`;
}

export const CONNECT_AWS_SECURELY_PERMISSIONS_HEADING = "IAM permissions";

export const CONNECT_AWS_SECURELY_RESOURCE_EXPLORER_NOTE =
  "Enable a Resource Explorer aggregator index in the AWS account and primary region used for the connection before running Re-poll now.";

export const CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_HEADING = "Do not assign broad write-enabled policies";

export const CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY =
  "ArchLucid does not require AdministratorAccess, PowerUserAccess, IAMFullAccess, or any policy that can modify your AWS infrastructure on your behalf.";

export const CONNECT_AWS_SECURELY_RETAINED_ITEMS = [
  "AWS account ID",
  "Primary region",
  "Read-only IAM role ARN",
  "Connection status",
  "Last polled timestamp",
] as const;

export const CONNECT_AWS_SECURELY_CREDENTIALS_ITEMS = [
  "Access key ID / secret access key pairs",
  "Administrator or PowerUser privileges",
  "Private keys",
] as const;

export const CONNECT_AWS_SECURELY_PERMISSIONS_ITEMS = [
  "AdministratorAccess",
  "PowerUserAccess",
  "IAMFullAccess",
  "Policies that grant infrastructure write or IAM administration",
] as const;

export const CONNECT_AWS_SECURELY_CONFIGURE_HREF = "/integrations/cloud-connections/aws";
