/**
 * Copyable Workload Identity Federation starter for `/integrations/cloud-connections/gcp` (TB-1775).
 * Pairs with help **TB-1242** — share this module when the help page adds the same template.
 */

export const GCP_WIF_STARTER_IDENTITY_INTRO =
  "Configure Workload Identity Federation so ArchLucid can impersonate a read-only service account. Use the federation identifiers and starter script below, then paste the pool provider resource name and service account email into Connection details.";

export const GCP_WIF_STARTER_FEDERATION_HEADING = "Federation identifiers";

export const GCP_WIF_STARTER_FEDERATION_INTRO =
  "Bind your Workload Identity Pool OIDC provider to ArchLucid's hosted Azure user-assigned managed identity. Obtain the current tenant ID and managed identity object ID from Assurance status or the in-product security review when values are environment-specific.";

export type GcpWifStarterFederationIdentifier = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly isPlaceholder: boolean;
};

export const GCP_WIF_STARTER_FEDERATION_IDENTIFIERS: readonly GcpWifStarterFederationIdentifier[] = [
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
    id: "provider-resource",
    label: "Provider resource name (example)",
    value:
      "projects/{your GCP project ID}/locations/global/workloadIdentityPools/archlucid-pool/providers/archlucid-azure-ad",
    isPlaceholder: true,
  },
] as const;

export const GCP_WIF_STARTER_SCRIPT_HEADING = "gcloud pool-provider starter";

export const GCP_WIF_STARTER_SCRIPT_INTRO =
  "Run this script in your GCP project (or translate it to Terraform) to create the pool, OIDC provider, read-only service account, and impersonation binding.";

export const GCP_WIF_STARTER_SCRIPT_REPLACE_HINT =
  "Before running, set PROJECT_ID, ARCHLUCID_TENANT_ID, and ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID at the top of the script. ArchLucid publishes the tenant and managed-identity object IDs during onboarding.";

export function formatGcpWorkloadIdentityPoolProviderResourceName(
  projectId: string,
  poolId: string,
  providerId: string,
): string {
  return `projects/${projectId}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;
}

export function buildGcpWorkloadIdentityPoolProviderSetupScript(
  projectIdPlaceholder = "YOUR_GCP_PROJECT_ID",
): string {
  return `# GCP Workload Identity Federation — ArchLucid pool provider starter (gcloud)
# Prefer IaC in your own repo when you already manage GCP identity with Terraform.
# ArchLucid stores project ID, provider resource name, and service account email only — no JSON keys.

# --- Replace these values before running ---
PROJECT_ID="${projectIdPlaceholder}"
POOL_ID="archlucid-pool"
PROVIDER_ID="archlucid-azure-ad"
SERVICE_ACCOUNT_NAME="archlucid-cloud-asset-reader"
ARCHLUCID_TENANT_ID="YOUR_ARCHLUCID_TENANT_ID"
ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID="YOUR_ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID"

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
  --allowed-audiences="api://AzureADTokenExchange" \\
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
