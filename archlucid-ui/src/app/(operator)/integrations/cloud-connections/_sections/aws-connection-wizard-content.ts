import type { WizardStepDefinition } from "@/components/wizard/WizardStepper";

export const AWS_CONNECTION_DETAIL_WIZARD_STEPS: WizardStepDefinition[] = [
  { label: "Configure IAM role", description: "OIDC trust policy" },
  { label: "Connection IDs", description: "Account, region, role ARN" },
  { label: "Save connection", description: "Review and persist" },
];

export const AWS_CONNECTION_WIZARD_IAM_STEP_LEAD =
  "Create a read-only IAM role that trusts ArchLucid's federated identity. Use the copyable trust-policy starter in Identity and access setup above, then return here with the role ARN.";

export const AWS_CONNECTION_WIZARD_IDS_STEP_LEAD =
  "Enter the AWS account ID, primary region, and read-only IAM role ARN from your federation setup. ArchLucid stores connection metadata only — no long-lived access keys.";

export const AWS_CONNECTION_WIZARD_SAVE_STEP_LEAD =
  "Review the identifiers below, then save the connection for scheduled read-only inventory collection.";
