import type { WizardStepDefinition } from "@/components/wizard/WizardStepper";

export const TIER2_CONNECTION_WIZARD_STEPS: WizardStepDefinition[] = [
  { label: "Security review", description: "RBAC and trust checklist" },
  { label: "Provision SP", description: "Azure CLI or IaC" },
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
    label: "Only Reader and Cost Management Reader roles are assigned (no Owner, Contributor, or write roles).",
  },
  {
    id: "federation",
    label:
      "Federated workload identity trusts ArchLucid's published managed identity — no long-lived client secrets are stored in ArchLucid.",
  },
  {
    id: "review",
    label: "Security review completed against the hosted Enterprise onboarding checklist and procurement FAQ.",
  },
];

export const TIER2_WIZARD_DOC_PATHS = {
  hostedEnterpriseChecklist: "/docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md",
  procurementFaq: "/docs/go-to-market/PROCUREMENT_FAQ.md",
  trustCenter: "/docs/go-to-market/trust-center.md",
  azureExtractor: "/docs/library/AZURE_EXTRACTOR.md",
  customerTrustAndAccess: "/docs/library/CUSTOMER_TRUST_AND_ACCESS.md",
} as const;

export function buildTier2AzureSetupScript(subscriptionIdPlaceholder = "YOUR_SUBSCRIPTION_ID"): string {
  return `# Tier 2 Azure extractor — customer tenant setup (Azure CLI)
# Prefer IaC: infra/terraform-customer-onboarding/ or infra/bicep-customer-onboarding/
# ArchLucid stores tenantId + appId + subscriptionId only — no client secrets.

TARGET_SCOPE="/subscriptions/${subscriptionIdPlaceholder}"
SP_NAME="archlucid-readonly-extractor"

# 1. Create app registration + service principal with Reader on scope
az ad sp create-for-rbac --name "$SP_NAME" --role "Reader" --scopes "$TARGET_SCOPE"

# 2. Assign Cost Management Reader (read-only cost access)
ASSIGNEE_OBJECT_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].id" -o tsv)
az role assignment create --assignee "$ASSIGNEE_OBJECT_ID" --role "Cost Management Reader" --scope "$TARGET_SCOPE"

# 3. Add federated credential trusting ArchLucid managed identity (replace placeholders)
APP_OBJECT_ID=$(az ad app list --display-name "$SP_NAME" --query "[0].id" -o tsv)
# ArchLucid publishes archLucidTenantId + archLucidManagedIdentityObjectId during onboarding
az ad app federated-credential create --id "$APP_OBJECT_ID" --parameters '{
  "name": "ArchLucidFederation",
  "issuer": "https://login.microsoftonline.com/ARCHLUCID_TENANT_ID/v2.0",
  "subject": "ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID",
  "description": "Trust ArchLucid hosted extractor MI",
  "audiences": ["api://AzureADTokenExchange"]
}'

# Record appId (client ID) and tenant ID from step 1 for the ArchLucid wizard.
`;
}
