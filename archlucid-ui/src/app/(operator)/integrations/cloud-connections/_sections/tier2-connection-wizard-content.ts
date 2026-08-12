import type { WizardStepDefinition } from "@/components/wizard/WizardStepper";
import {
  AZURE_CONNECTION_SETUP_SCRIPT_FEDERATION_DESCRIPTION,
  AZURE_CONNECTION_SETUP_SCRIPT_VALIDATION_NOTE,
  AZURE_CONNECTION_WIZARD_SAVE_STEP_DESCRIPTION,
} from "@/lib/azure-cloud-connection-copy";
import type { AzureHostedFederationConfig } from "@/lib/azure-cloud-connection-federation-config";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const TIER2_CONNECTION_WIZARD_STEPS: WizardStepDefinition[] = [
  { label: "Security preflight", description: "Confirm access posture" },
  { label: "Create Azure identity", description: "Azure CLI or IaC" },
  { label: "Connection IDs", description: "Tenant, app, subscriptions" },
  { label: "Save & validate", description: AZURE_CONNECTION_WIZARD_SAVE_STEP_DESCRIPTION },
];

export const TIER2_CONNECTION_DETAIL_WIZARD_STEPS: WizardStepDefinition[] = [
  { label: "Create Azure identity", description: "Azure CLI or IaC" },
  { label: "Connection IDs", description: "Tenant, app, subscriptions" },
  { label: "Save & validate", description: AZURE_CONNECTION_WIZARD_SAVE_STEP_DESCRIPTION },
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

/** Helper copy — only SUBSCRIPTION_ID remains operator-supplied in the rendered script. */
export const TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT =
  "Before running, set SUBSCRIPTION_ID at the top of the script to your Azure subscription GUID. ArchLucid tenant and managed-identity object IDs are pre-filled from this environment.";

export type Tier2AzureSetupScriptOptions = {
  readonly subscriptionIdPlaceholder?: string;
  readonly archlucidTenantId: string;
  readonly archlucidManagedIdentityObjectId: string;
};

export function buildTier2AzureSetupScript(options: Tier2AzureSetupScriptOptions): string {
  const subscriptionIdPlaceholder = options.subscriptionIdPlaceholder ?? "YOUR_SUBSCRIPTION_ID";
  const archlucidTenantId = options.archlucidTenantId;
  const archlucidManagedIdentityObjectId = options.archlucidManagedIdentityObjectId;

  // Shell variables at the top so replace targets are visible without scrolling into step 3 JSON.
  // Escape \${...} so TypeScript does not interpolate; bash expands them when the script runs.
  return `# Azure read-only extractor — customer tenant setup (Azure CLI)
# Prefer IaC: infra/terraform-customer-onboarding/ or infra/bicep-customer-onboarding/
# ArchLucid stores tenantId + appId + subscriptionId only — no client secrets.

# --- Replace SUBSCRIPTION_ID before running ---
SUBSCRIPTION_ID="${subscriptionIdPlaceholder}"
ARCHLUCID_TENANT_ID="${archlucidTenantId}"
ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID="${archlucidManagedIdentityObjectId}"

TARGET_SCOPE="/subscriptions/\${SUBSCRIPTION_ID}"
SP_NAME="archlucid-readonly-extractor"

# 1. Create app registration + service principal with Reader on scope (required)
az ad sp create-for-rbac --name "$SP_NAME" --role "Reader" --scopes "$TARGET_SCOPE"

# 2. Optional — Cost Management Reader (read-only cost evidence)
# Skip if cost collection is not needed, or if your Azure admin cannot assign this role.
${AZURE_CONNECTION_SETUP_SCRIPT_VALIDATION_NOTE}
# ASSIGNEE_OBJECT_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].id" -o tsv)
# az role assignment create --assignee "$ASSIGNEE_OBJECT_ID" --role "Cost Management Reader" --scope "$TARGET_SCOPE"

# 3. Add federated credential trusting ArchLucid managed identity
APP_OBJECT_ID=$(az ad app list --display-name "$SP_NAME" --query "[0].id" -o tsv)
az ad app federated-credential create --id "$APP_OBJECT_ID" --parameters "{
  \\"name\\": \\"ArchLucidFederation\\",
  \\"issuer\\": \\"https://login.microsoftonline.com/\${ARCHLUCID_TENANT_ID}/v2.0\\",
  \\"subject\\": \\"\${ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID}\\",
  \\"description\\": \\"${AZURE_CONNECTION_SETUP_SCRIPT_FEDERATION_DESCRIPTION}\\",
  \\"audiences\\": [\\"api://AzureADTokenExchange\\"]
}"

# Record appId (client ID) and tenant ID from step 1 for the ArchLucid wizard.
`;
}

export type Tier2AzureFederationIdentifier = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
};

export function tier2AzureFederationIdentifiers(config: AzureHostedFederationConfig): readonly Tier2AzureFederationIdentifier[] {
  return [
    {
      id: "archlucid-tenant-id",
      label: "ArchLucid tenant ID",
      value: config.tenantId,
    },
    {
      id: "archlucid-managed-identity-object-id",
      label: "ArchLucid managed identity object ID",
      value: config.managedIdentityObjectId,
    },
  ];
}
