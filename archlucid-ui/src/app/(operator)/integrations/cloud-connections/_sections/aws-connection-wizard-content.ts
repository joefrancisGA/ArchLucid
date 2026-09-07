import type { WizardStepDefinition } from "@/components/wizard/WizardStepper";

import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { localizeProductCopy } from "@/lib/product-line/product-line-display-name";

export const AWS_CONNECTION_DETAIL_WIZARD_STEPS: WizardStepDefinition[] = [
  { label: "Connection IDs", description: "Account, region, role ARN" },
  { label: "Save connection", description: "Review and persist" },
];

export const AWS_CONNECTION_WIZARD_IDS_STEP_LEAD =
  "After configuring the read-only IAM role in Identity and access setup above, enter the AWS account ID, primary region, and role ARN. ArchLucid stores connection metadata only — no long-lived access keys.";

export function awsConnectionWizardIdsStepLead(productLineId: ProductLineId = "architecture"): string {
  return localizeProductCopy(productLineId, AWS_CONNECTION_WIZARD_IDS_STEP_LEAD);
}

export const AWS_CONNECTION_WIZARD_SAVE_STEP_LEAD =
  "Review the identifiers below, then save the connection for scheduled read-only inventory collection.";
