/**
 * Customer-facing copy for `/help/cloud-connections/aws`.
 * Permission rows reuse `aws-cloud-connection-permissions-manifest.ts`.
 */
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONNECT_AWS_SECURELY_PAGE_TITLE = "Connect AWS securely";

export const CONNECT_AWS_SECURELY_PAGE_LEAD =
  "Connecting AWS adds current Resource Explorer inventory to architecture reviews. The connection is optional — ArchLucid can still review uploaded documents, briefs, and diagrams without cloud access.";

/** @deprecated Prefer {@link CONNECT_AWS_SECURELY_PAGE_LEAD} in new surfaces. */
export const CONNECT_AWS_SECURELY_PAGE_INTRO =
  "ArchLucid can use AWS resource inventory when you connect an AWS account. The AWS connection is optional; reviews can also use briefs, diagrams, documents, and uploaded inventory.";

/** @deprecated Prefer {@link CONNECT_AWS_SECURELY_PAGE_LEAD} in new surfaces. */
export const CONNECT_AWS_SECURELY_CONNECTION_VALUE =
  "Connecting AWS adds current Resource Explorer inventory to reviews. ArchLucid can still review uploaded documents and diagrams without a cloud connection.";

export const CONNECT_AWS_SECURELY_WITHOUT_CONNECTION_NOTE =
  "Reviews can proceed with briefs, diagrams, documents, and uploaded evidence when you choose not to connect.";

export const CONNECT_AWS_SECURELY_OPTIONAL_ZIP_NOTE =
  "You can also export a read-only inventory ZIP from your AWS account with your own operator credentials and upload it from the New architecture review wizard. ArchLucid never receives your AWS access keys.";

export const CONNECT_AWS_SECURELY_STEP_AWS_CONNECTION_SETTINGS_LINK = "AWS connection settings";

export const CONNECT_AWS_SECURELY_DETAILED_SETUP_LINK =
  "Configure OIDC trust and IAM role (detailed procedure)";

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

export {
  AWS_TRUST_STARTER_FEDERATION_HEADING as CONNECT_AWS_SECURELY_FEDERATION_HEADING,
  AWS_TRUST_STARTER_FEDERATION_IDENTIFIERS as CONNECT_AWS_SECURELY_FEDERATION_IDENTIFIERS,
  AWS_TRUST_STARTER_FEDERATION_INTRO as CONNECT_AWS_SECURELY_FEDERATION_INTRO,
  AWS_TRUST_STARTER_TRUST_POLICY_HEADING as CONNECT_AWS_SECURELY_TRUST_POLICY_HEADING,
  AWS_TRUST_STARTER_TRUST_POLICY_INTRO as CONNECT_AWS_SECURELY_TRUST_POLICY_INTRO,
  AWS_TRUST_STARTER_TRUST_POLICY_REPLACE_HINT as CONNECT_AWS_SECURELY_TRUST_POLICY_REPLACE_HINT,
  buildAwsTrustStarterPolicyTemplate as buildAwsCloudConnectionTrustPolicyTemplate,
  type AwsTrustStarterFederationIdentifier as ConnectAwsSecurelyFederationIdentifier,
} from "@/lib/aws-cloud-connection-trust-policy-starter";

export const CONNECT_AWS_SECURELY_PERMISSIONS_HEADING = "IAM permissions";

export const CONNECT_AWS_SECURELY_RESOURCE_EXPLORER_NOTE =
  "Enable a Resource Explorer aggregator index in the AWS account and primary region used for the connection before running Re-poll now.";

export const CONNECT_AWS_SECURELY_PERMISSIONS_AUTHORITY_NOTE =
  "The IAM permissions table below is the authoritative reference for Resource Explorer APIs, managed policies, and aggregator-index prerequisites.";

export const CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_HEADING = "Do not assign broad write-enabled policies";

export const CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_STATUS_LABEL = "Restricted policies";

export const CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY =
  "ArchLucid does not require AdministratorAccess, PowerUserAccess, IAMFullAccess, or any policy that can modify your AWS infrastructure on your behalf.";

export const CONNECT_AWS_SECURELY_VERIFICATION_HEADING = "What Re-poll now confirms";

export const CONNECT_AWS_SECURELY_VERIFICATION_CHECKS_LABEL = "Confirmed by Re-poll now";

export const CONNECT_AWS_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL = "Not confirmed by Re-poll now";

export const CONNECT_AWS_SECURELY_VERIFICATION_CHECKS: readonly string[] = [
  "OIDC web identity federation (AssumeRoleWithWebIdentity)",
  "Resource Explorer Search access in the connected account and primary region",
  "Inventory import into the workspace",
];

export const CONNECT_AWS_SECURELY_VERIFICATION_DOES_NOT_VERIFY: readonly string[] = [
  "Organization-wide inventory outside the connected AWS account",
  "Cost, billing, or AWS Config export permissions",
];

export const CONNECT_AWS_SECURELY_VERIFY_STEP_TEXT = "run Re-poll now to confirm federated assume-role and inventory access";

export const CONNECT_AWS_SECURELY_VERIFY_SECTION_ID = "validate-connection";

export const CONNECT_AWS_SECURELY_CLOUD_CONNECTIONS_HELP_HREF = inAppHelpHref("cloud-connections");

export const CONNECT_AWS_SECURELY_CONNECTION_STATUS_HREF = "/administration/connection-status";

export const CONNECT_AWS_SECURELY_CONNECTION_STATUS_LINK_LABEL = "Connection status";

export function buildConnectAwsSecurelyVerifyHref(returnHref?: string): string {
  const trimmed = returnHref?.trim() ?? "";
  const basePath = (trimmed.split("#")[0] ?? "").split("?")[0] ?? "";

  if (
    basePath === CONNECT_AWS_SECURELY_CONFIGURE_HREF ||
    basePath.startsWith(`${CONNECT_AWS_SECURELY_CONFIGURE_HREF}/`)
  ) {
    return `${basePath}#${CONNECT_AWS_SECURELY_VERIFY_SECTION_ID}`;
  }

  return `${CONNECT_AWS_SECURELY_CONFIGURE_HREF}#${CONNECT_AWS_SECURELY_VERIFY_SECTION_ID}`;
}

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

export const CONNECT_AWS_SECURELY_TRUST_POLICY_COPY_ERROR =
  "Could not copy the trust policy. Select the template below and copy it manually.";
