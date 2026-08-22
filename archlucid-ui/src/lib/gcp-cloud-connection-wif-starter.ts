/**
 * Copyable Workload Identity Federation starter for `/integrations/cloud-connections/gcp` (TB-1775).
 * Pairs with help **TB-1242** — share this module when the help page adds the same template.
 */
import type { AzureHostedFederationConfig } from "@/lib/azure-cloud-connection-federation-config";
import { isAzureHostedFederationConfigComplete } from "@/lib/azure-cloud-connection-federation-config";
import { isAzureGuid } from "@/lib/azure-identifier-validation";
import { GCP_FEDERATION_IDENTIFIER_SOURCING } from "@/lib/gcp-cloud-connection-federation-identity-source";

export const GCP_WIF_POOL_ID = "archlucid-pool" as const;

export const GCP_WIF_PROVIDER_ID = "archlucid-azure-ad" as const;

export const GCP_WIF_EXAMPLE_PROJECT_ID_PLACEHOLDER = "{your GCP project ID}" as const;

export const GCP_WIF_STARTER_IDENTITY_INTRO =
  "Configure Workload Identity Federation so ArchLucid can impersonate a read-only service account. Use the federation identifiers and starter script below, then paste the pool provider resource name and service account email into Connection details.";

export const GCP_WIF_STARTER_FEDERATION_HEADING = "Federation identifiers";

export const GCP_WIF_STARTER_FEDERATION_INTRO =
  `Bind your Workload Identity Pool OIDC provider to ArchLucid's hosted Azure user-assigned managed identity. ${GCP_FEDERATION_IDENTIFIER_SOURCING}`;

export type GcpWifStarterFederationIdentifier = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly isPlaceholder: boolean;
};

const GCP_WIF_TOKEN_AUDIENCE = "api://AzureADTokenExchange" as const;

export function formatGcpEntraOidcIssuerUri(tenantId: string): string {
  return `https://login.microsoftonline.com/${tenantId}/v2.0`;
}

export function buildGcpWifStarterFederationIdentifiers(
  config: AzureHostedFederationConfig,
): readonly GcpWifStarterFederationIdentifier[] {
  const tenantResolved = isAzureGuid(config.tenantId);
  const subjectResolved = isAzureGuid(config.managedIdentityObjectId);

  return [
    {
      id: "issuer",
      label: "OIDC issuer (Entra ID)",
      value: tenantResolved
        ? formatGcpEntraOidcIssuerUri(config.tenantId)
        : "Tenant ID not published for this environment",
      hint: "Entra issuer URL ArchLucid publishes for this environment. Use it as the OIDC issuer on the Workload Identity Pool provider.",
      isPlaceholder: !tenantResolved,
    },
    {
      id: "audience",
      label: "Token audience",
      value: GCP_WIF_TOKEN_AUDIENCE,
      hint: "Must match api://AzureADTokenExchange on the Workload Identity Pool OIDC provider.",
      isPlaceholder: false,
    },
    {
      id: "subject",
      label: "Subject (managed identity object ID)",
      value: subjectResolved
        ? config.managedIdentityObjectId
        : "Managed identity object ID not published for this environment",
      hint: "Object ID of ArchLucid's managed identity. The federated credential subject must match this value.",
      isPlaceholder: !subjectResolved,
    },
    {
      id: "attribute-mapping",
      label: "Attribute mapping",
      value: "google.subject=assertion.sub,attribute.tenant=assertion.tid",
      hint: "Maps the Entra token subject and tenant claims into GCP attributes for impersonation.",
      isPlaceholder: false,
    },
    {
      id: "provider-resource",
      label: "Provider resource name (example)",
      value: formatGcpWorkloadIdentityPoolProviderResourceName(
        GCP_WIF_EXAMPLE_PROJECT_ID_PLACEHOLDER,
        GCP_WIF_POOL_ID,
        GCP_WIF_PROVIDER_ID,
      ),
      hint: "Example resource name to paste into Connection details after you create the pool provider.",
      isPlaceholder: true,
    },
  ] as const;
}

/** Static identifiers for help re-exports when federation config is unavailable at import time. */
export const GCP_WIF_STARTER_FEDERATION_IDENTIFIERS: readonly GcpWifStarterFederationIdentifier[] =
  buildGcpWifStarterFederationIdentifiers({
    tenantId: "",
    managedIdentityObjectId: "",
  });

export const GCP_WIF_STARTER_SCRIPT_HEADING = "gcloud pool-provider starter";

export const GCP_WIF_STARTER_SCRIPT_INTRO =
  "Run this script in your GCP project (or translate it to Terraform) to create the pool, OIDC provider, read-only service account, and impersonation binding.";

export const GCP_WIF_STARTER_SCRIPT_REPLACE_HINT =
  "Before running, set PROJECT_ID at the top of the script to your GCP project ID. ArchLucid tenant and managed-identity object IDs are pre-filled when published for this environment.";

export function formatGcpWorkloadIdentityPoolProviderResourceName(
  projectId: string,
  poolId: string,
  providerId: string,
): string {
  return `projects/${projectId}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;
}

export function buildGcpWorkloadIdentityPoolProviderSetupScript(
  projectIdPlaceholder = "YOUR_GCP_PROJECT_ID",
  federationConfig: AzureHostedFederationConfig = { tenantId: "", managedIdentityObjectId: "" },
): string {
  const tenantIdPlaceholder = isAzureGuid(federationConfig.tenantId)
    ? federationConfig.tenantId
    : "YOUR_ARCHLUCID_TENANT_ID";
  const managedIdentityPlaceholder = isAzureGuid(federationConfig.managedIdentityObjectId)
    ? federationConfig.managedIdentityObjectId
    : "YOUR_ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID";

  return `# GCP Workload Identity Federation — ArchLucid pool provider starter (gcloud)
# Prefer IaC in your own repo when you already manage GCP identity with Terraform.
# ArchLucid stores project ID, provider resource name, and service account email only — no JSON keys.

# --- Replace these values before running ---
PROJECT_ID="${projectIdPlaceholder}"
POOL_ID="${GCP_WIF_POOL_ID}"
PROVIDER_ID="${GCP_WIF_PROVIDER_ID}"
SERVICE_ACCOUNT_NAME="archlucid-cloud-asset-reader"
ARCHLUCID_TENANT_ID="${tenantIdPlaceholder}"
ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID="${managedIdentityPlaceholder}"

PROJECT_NUMBER=$(gcloud projects describe "\${PROJECT_ID}" --format="value(projectNumber)")
SERVICE_ACCOUNT_EMAIL="\${SERVICE_ACCOUNT_NAME}@\${PROJECT_ID}.iam.gserviceaccount.com"
PROVIDER_RESOURCE="projects/\${PROJECT_ID}/locations/global/workloadIdentityPools/\${POOL_ID}/providers/\${PROVIDER_ID}"

# 1. Enable required APIs
gcloud services enable iam.googleapis.com cloudasset.googleapis.com --project="\${PROJECT_ID}"

# 2. Create workload identity pool
gcloud iam workload-identity-pools create "\${POOL_ID}" \\
  --project="\${PROJECT_ID}" \\
  --location="global" \\
  --display-name="ArchLucid federation"

# 3. Create OIDC provider trusting ArchLucid's Entra managed identity
gcloud iam workload-identity-pools providers create-oidc "\${PROVIDER_ID}" \\
  --project="\${PROJECT_ID}" \\
  --location="global" \\
  --workload-identity-pool="\${POOL_ID}" \\
  --display-name="ArchLucid Entra federation" \\
  --issuer-uri="https://login.microsoftonline.com/\${ARCHLUCID_TENANT_ID}/v2.0" \\
  --allowed-audiences="${GCP_WIF_TOKEN_AUDIENCE}" \\
  --attribute-mapping="google.subject=assertion.sub,attribute.tenant=assertion.tid"

# 4. Create read-only service account (skip if you already have one)
gcloud iam service-accounts create "\${SERVICE_ACCOUNT_NAME}" \\
  --project="\${PROJECT_ID}" \\
  --display-name="ArchLucid Cloud Asset reader"

# 5. Grant Cloud Asset Viewer
gcloud projects add-iam-policy-binding "\${PROJECT_ID}" \\
  --member="serviceAccount:\${SERVICE_ACCOUNT_EMAIL}" \\
  --role="roles/cloudasset.viewer"

# 6. Allow the federated principal to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding "\${SERVICE_ACCOUNT_EMAIL}" \\
  --project="\${PROJECT_ID}" \\
  --role="roles/iam.workloadIdentityUser" \\
  --member="principal://iam.googleapis.com/projects/\${PROJECT_NUMBER}/locations/global/workloadIdentityPools/\${POOL_ID}/subject/\${ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID}"

echo "Paste into ArchLucid connection form:"
echo "  Provider: \${PROVIDER_RESOURCE}"
echo "  Service account: \${SERVICE_ACCOUNT_EMAIL}"
`;
}

export function isGcpWifStarterFederationConfigResolvable(config: AzureHostedFederationConfig): boolean {
  return isAzureHostedFederationConfigComplete(config);
}
