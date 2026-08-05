import type { WizardStepDefinition } from "@/components/wizard/WizardStepper";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const TIER2_CONNECTION_WIZARD_STEPS: WizardStepDefinition[] = [
  { label: "Security preflight", description: "Confirm access posture" },
  { label: "Create Azure identity", description: "Azure CLI or IaC" },
  { label: "Connection IDs", description: "Tenant, app, subscriptions" },
  { label: "Save & validate", description: "Persist and test pull" },
];

export const TIER2_CONNECTION_DETAIL_WIZARD_STEPS: WizardStepDefinition[] = [
  { label: "Create Azure identity", description: "Azure CLI or IaC" },
  { label: "Connection IDs", description: "Tenant, app, subscriptions" },
  { label: "Save & validate", description: "Persist and test pull" },
];

export type Tier2RbacChecklistItem = {
  id: string;
  label: string;
};

export const TIER2_RBAC_CHECKLIST_ITEMS: Tier2RbacChecklistItem[] = [
  {
    id: "scope",
    label:
      "Service principal is scoped to a subscription or management group only — not tenant-wide Directory.Read.All or Global Reader.",
  },
  {
    id: "roles",
    label:
      "Reader is assigned for inventory; Cost Management Reader is optional when cost evidence is needed (no Owner, Contributor, or write roles).",
  },
  {
    id: "federation",
    label:
      "Federated workload identity trusts ArchLucid's published managed identity — no long-lived client secrets are stored in ArchLucid.",
  },
  {
    id: "review",
    label: "Security review completed against Connect Azure securely and procurement FAQ.",
  },
];

export const TIER2_WIZARD_DOC_PATHS = {
  hostedEnterpriseChecklist: "/docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md",
  procurementFaq: "/docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#enterprise-procurement-faq",
  trustCenter: "/docs/go-to-market/trust-center.md",
  azureExtractor: "/docs/library/AZURE_EXTRACTOR.md",
  customerTrustAndAccess: "/docs/library/CUSTOMER_TRUST_AND_ACCESS.md",
} as const;

/** In-app help and workspace routes for cloud-connection contextual links. */
export const TIER2_WIZARD_HELP_HREFS = {
  hostedEnterpriseOnboarding: inAppHelpHref("enterprise-onboarding"),
  procurementFaq: inAppHelpHref("procurement"),
  trustCenter: "/administration/security-trust",
  connectAzureSecurely: "/help/cloud-connections/azure",
  azurePermissions: inAppHelpHref("azure-permissions"),
  securityTrust: inAppHelpHref("security-trust"),
} as const;

/** Helper copy — names the exact variables at the top of {@link buildTier2AzureSetupScript}. */
export const TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT =
  "Before running, set SUBSCRIPTION_ID, ARCHLUCID_TENANT_ID, and ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID at the top of the script. ArchLucid publishes the tenant and managed-identity object IDs during onboarding.";

export function buildTier2AzureSetupScript(subscriptionIdPlaceholder = "YOUR_SUBSCRIPTION_ID"): string {
  // Shell variables at the top so replace targets are visible without scrolling into step 3 JSON.
  // Escape \${...} so TypeScript does not interpolate; bash expands them when the script runs.
  return `# Azure read-only extractor — customer tenant setup (Azure CLI)
# Prefer IaC: infra/terraform-customer-onboarding/ or infra/bicep-customer-onboarding/
# ArchLucid stores tenantId + appId + subscriptionId only — no client secrets.

# --- Replace these three values before running ---
SUBSCRIPTION_ID="${subscriptionIdPlaceholder}"
ARCHLUCID_TENANT_ID="YOUR_ARCHLUCID_TENANT_ID"
ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID="YOUR_ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID"

TARGET_SCOPE="/subscriptions/\${SUBSCRIPTION_ID}"
SP_NAME="archlucid-readonly-extractor"

# 1. Create app registration + service principal with Reader on scope (required)
az ad sp create-for-rbac --name "$SP_NAME" --role "Reader" --scopes "$TARGET_SCOPE"

# 2. Optional — Cost Management Reader (read-only cost evidence)
# Skip if cost collection is not needed, or if your Azure admin cannot assign this role.
# Hosted connection validation requires Reader only.
# ASSIGNEE_OBJECT_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].id" -o tsv)
# az role assignment create --assignee "$ASSIGNEE_OBJECT_ID" --role "Cost Management Reader" --scope "$TARGET_SCOPE"

# 3. Add federated credential trusting ArchLucid managed identity
APP_OBJECT_ID=$(az ad app list --display-name "$SP_NAME" --query "[0].id" -o tsv)
az ad app federated-credential create --id "$APP_OBJECT_ID" --parameters "{
  \\"name\\": \\"ArchLucidFederation\\",
  \\"issuer\\": \\"https://login.microsoftonline.com/\${ARCHLUCID_TENANT_ID}/v2.0\\",
  \\"subject\\": \\"\${ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID}\\",
  \\"description\\": \\"Trust ArchLucid hosted extractor MI\\",
  \\"audiences\\": [\\"api://AzureADTokenExchange\\"]
}"

# Record appId (client ID) and tenant ID from step 1 for the ArchLucid wizard.
`;
}
