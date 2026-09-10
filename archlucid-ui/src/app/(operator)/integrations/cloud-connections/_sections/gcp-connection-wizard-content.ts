import type { WizardStepDefinition } from "@/components/wizard/WizardStepper";
import {
  formatGcpWorkloadIdentityPoolProviderResourceName,
  GCP_WIF_EXAMPLE_PROJECT_ID_PLACEHOLDER,
  GCP_WIF_POOL_ID,
  GCP_WIF_PROVIDER_ID,
} from "@/lib/gcp-cloud-connection-wif-starter";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { localizeProductCopy } from "@/lib/product-line/product-line-display-name";

export const GCP_CONNECTION_WIZARD_POOL_PROVIDER_PLACEHOLDER = formatGcpWorkloadIdentityPoolProviderResourceName(
  GCP_WIF_EXAMPLE_PROJECT_ID_PLACEHOLDER,
  GCP_WIF_POOL_ID,
  GCP_WIF_PROVIDER_ID,
);

export const GCP_CONNECTION_DETAIL_WIZARD_STEPS: WizardStepDefinition[] = [
  { label: "Connection IDs", description: "Project, pool provider, service account" },
  { label: "Save connection", description: "Review and persist" },
];

export const GCP_CONNECTION_WIZARD_IDS_STEP_LEAD =
  "After configuring Workload Identity Federation in Identity and access setup above, enter the GCP project ID, pool provider resource name, and read-only service account email. ArchLucid stores connection metadata only — no service-account JSON keys.";

export function gcpConnectionWizardIdsStepLead(productLineId: ProductLineId = "architecture"): string {
  return localizeProductCopy(productLineId, GCP_CONNECTION_WIZARD_IDS_STEP_LEAD);
}

export const GCP_CONNECTION_WIZARD_SAVE_STEP_LEAD =
  "Review the identifiers below, then save the connection for scheduled read-only inventory collection.";
