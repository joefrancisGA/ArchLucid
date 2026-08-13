/**
 * Copyable IAM OIDC trust-policy starter for `/integrations/cloud-connections/aws` (TB-1765).
 * Pairs with help **TB-1237** — `connect-aws-securely-help-content.ts` re-exports these symbols.
 */

export const AWS_TRUST_STARTER_IDENTITY_INTRO =
  "Create a read-only IAM role with an OIDC trust policy for ArchLucid's federated identity. Use the federation identifiers and copyable template below, then paste your role ARN into Connection details.";

export const AWS_TRUST_STARTER_FEDERATION_HEADING = "Federation identifiers";

/** Lead-in before inline federation-intro links in {@link AwsTrustPolicyStarterPanel}. */
export const AWS_TRUST_STARTER_FEDERATION_INTRO_LEAD =
  "Bind your IAM OIDC identity provider and role trust policy to ArchLucid's hosted Azure user-assigned managed identity. Obtain the current tenant ID and managed identity object ID from";

/** Trailing clause after the Connection status link in the federation intro. */
export const AWS_TRUST_STARTER_FEDERATION_INTRO_MID = "or the";

/** Closing clause after the AWS help link in the federation intro. */
export const AWS_TRUST_STARTER_FEDERATION_INTRO_TAIL =
  "when values are environment-specific.";

/** @deprecated Render {@link AWS_TRUST_STARTER_FEDERATION_INTRO_LEAD} with links in AwsTrustPolicyStarterPanel instead. */
export const AWS_TRUST_STARTER_FEDERATION_INTRO = `${AWS_TRUST_STARTER_FEDERATION_INTRO_LEAD} Assurance status or the in-product AWS connection security review ${AWS_TRUST_STARTER_FEDERATION_INTRO_TAIL}`;

export type AwsTrustStarterFederationIdentifier = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly isPlaceholder: boolean;
};

export const AWS_TRUST_STARTER_FEDERATION_IDENTIFIERS: readonly AwsTrustStarterFederationIdentifier[] = [
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

export const AWS_TRUST_STARTER_TRUST_POLICY_HEADING = "IAM trust policy template";

export const AWS_TRUST_STARTER_TRUST_POLICY_INTRO =
  "Use this AssumeRoleWithWebIdentity trust policy on your read-only IAM role. Replace placeholder values before applying it in AWS.";

export const AWS_TRUST_STARTER_TRUST_POLICY_REPLACE_HINT =
  "Replace {your AWS account ID}, {ArchLucid tenant ID}, and {ArchLucid managed identity object ID} with your values. Create the IAM OIDC provider in your account before attaching this trust policy.";

export function buildAwsTrustStarterPolicyTemplate(): string {
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
