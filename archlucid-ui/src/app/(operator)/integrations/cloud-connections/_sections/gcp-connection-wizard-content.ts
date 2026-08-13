import type { WizardStepDefinition } from "@/components/wizard/WizardStepper";
import {
  formatGcpWorkloadIdentityPoolProviderResourceName,
  GCP_WIF_EXAMPLE_PROJECT_ID_PLACEHOLDER,
  GCP_WIF_POOL_ID,
  GCP_WIF_PROVIDER_ID,
} from "@/lib/gcp-cloud-connection-wif-starter";

export const GCP_CONNECTION_WIZARD_POOL_PROVIDER_PLACEHOLDER = formatGcpWorkloadIdentityPoolProviderResourceName(
  GCP_WIF_EXAMPLE_PROJECT_ID_PLACEHOLDER,
  GCP_WIF_POOL_ID,
  GCP_WIF_PROVIDER_ID,
);

export const GCP_CONNECTION_DETAIL_WIZARD_STEPS: WizardStepDefinition[] = [
  { label: "Configure WIF", description: "Pool and provider binding" },
  { label: "Connection IDs", description: "Project, pool provider, service account" },
  { label: "Save connection", description: "Review and persist" },
];

export const GCP_CONNECTION_WIZARD_WIF_STEP_LEAD =
  "Create a Workload Identity Pool provider that trusts ArchLucid's federated identity. Use the copyable federation starter in Identity and access setup above, then return here with the pool provider resource name.";

export const GCP_CONNECTION_WIZARD_IDS_STEP_LEAD =
  "Enter the GCP project ID, Workload Identity Pool provider resource, and read-only service account email. ArchLucid stores connection metadata only — no service-account JSON keys.";

export const GCP_CONNECTION_WIZARD_SAVE_STEP_LEAD =
  "Review the identifiers below, then save the connection for scheduled read-only inventory collection.";
