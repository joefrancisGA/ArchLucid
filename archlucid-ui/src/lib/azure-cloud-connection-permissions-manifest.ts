/**
 * Customer-facing Azure cloud-connection permission contract.
 * Keep in sync with Tier 2 hosted extractor, customer IaC (`infra/terraform-customer-onboarding`),
 * `archlucid az-roles`, and `scripts/ci/tests/test_hosted_azure_extractor_onboarding_roles.py`.
 */
export const AZURE_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION = "2026-07-13";

export type AzurePermissionRequirementLabel = "required" | "optional" | "conditional";

export function formatAzurePermissionRequirementLabel(label: AzurePermissionRequirementLabel): string {
  switch (label) {
    case "required":
      return "Required";
    case "optional":
      return "Optional";
    case "conditional":
      return "Conditional";
    default: {
      const exhaustive: never = label;

      return exhaustive;
    }
  }
}

export type AzureCloudConnectionRoleRow = {
  readonly azureRole: string;
  readonly requirement: AzurePermissionRequirementLabel;
  readonly purpose: string;
  readonly recommendedScope: string;
  readonly writeAccess: false;
  readonly enabledCapabilities: readonly string[];
  readonly dataCategories: readonly string[];
  readonly supportedScopes: readonly string[];
  readonly omittedImpact: string | null;
  readonly expandedDetails: string;
};

export type AzureCloudConnectionReadAction = {
  readonly action: string;
  readonly requirement: AzurePermissionRequirementLabel;
  readonly usedBy: string;
};

export const AZURE_CLOUD_CONNECTION_FORBIDDEN_ROLES: readonly string[] = [
  "Owner",
  "Contributor",
  "User Access Administrator",
  "Global Reader",
];

export const AZURE_CLOUD_CONNECTION_ROLE_ROWS: readonly AzureCloudConnectionRoleRow[] = [
  {
    azureRole: "Reader",
    requirement: "required",
    purpose: "Collects Azure resource inventory and configuration metadata for architecture evidence.",
    recommendedScope: "Subscription (one assignment per connected subscription)",
    writeAccess: false,
    enabledCapabilities: [
      "Hosted Tier 2 inventory pull",
      "Connection validation pull (resource listing)",
      "Tier 1 extractor inventory and policy definition reads",
    ],
    dataCategories: [
      "Resource types, names, locations, and IDs",
      "SKU and selected configuration metadata",
      "Resource tags",
      "Policy definitions and assignments (Tier 1 script path)",
    ],
    supportedScopes: [
      "/subscriptions/{subscriptionId}",
      "Tier 1 manual script also supports resource group and management group scopes",
    ],
    omittedImpact:
      "Without Reader, ArchLucid cannot collect inventory or complete a hosted validation pull for the subscription.",
    expandedDetails:
      "Hosted Tier 2 collection calls GET https://management.azure.com/subscriptions/{subscriptionId}/resources. Tier 1 manual upload can collect broader inventory when run at management-group or resource-group scope.",
  },
  {
    azureRole: "Cost Management Reader",
    requirement: "conditional",
    purpose: "Collects cost and usage evidence when cost analysis is enabled.",
    recommendedScope: "Same subscription scope as Reader",
    writeAccess: false,
    enabledCapabilities: [
      "Tier 1 extractor actual cost summary when -IncludeCost is used",
      "Future hosted cost merge when enabled in product configuration",
    ],
    dataCategories: ["Subscription actual cost summaries", "Usage-based cost signals for review context"],
    supportedScopes: ["/subscriptions/{subscriptionId}"],
    omittedImpact:
      "Architecture review remains available, but cost evidence and related findings may be incomplete when cost analysis is expected.",
    expandedDetails:
      "Customer onboarding templates assign Cost Management Reader at subscription scope. Hosted Tier 2 validation today confirms Reader access only; cost APIs are not called on the hosted GET-only collector path yet.",
  },
];

export const AZURE_CLOUD_CONNECTION_CUSTOM_ROLE_READ_ACTIONS: readonly AzureCloudConnectionReadAction[] = [
  {
    action: "Microsoft.Resources/subscriptions/read",
    requirement: "required",
    usedBy: "Subscription scope validation",
  },
  {
    action: "Microsoft.Resources/subscriptions/resources/read",
    requirement: "required",
    usedBy: "Hosted Tier 2 inventory and validation pull",
  },
  {
    action: "Microsoft.PolicyInsights/policyStates/queryResults/action",
    requirement: "optional",
    usedBy: "Tier 1 manual extractor policy compliance (not hosted Tier 2)",
  },
  {
    action: "Microsoft.CostManagement/query/action",
    requirement: "conditional",
    usedBy: "Tier 1 manual extractor when -IncludeCost is enabled",
  },
];

export const AZURE_CLOUD_CONNECTION_DATA_COLLECTED: readonly string[] = [
  "Azure resource inventory (types, locations, names, resource IDs)",
  "Selected configuration metadata and tags on supported resources",
  "Policy definitions and assignments when collected through the Tier 1 script",
  "Cost and usage summaries when Cost Management Reader is assigned and cost collection is enabled",
];

export const AZURE_CLOUD_CONNECTION_DATA_NOT_COLLECTED: readonly string[] = [
  "Key Vault secret values, certificates, or private keys",
  "Storage account keys, connection strings, or SAS tokens",
  "Virtual machine disks, files, or application payloads",
  "Application or platform logs",
  "Entra ID user passwords or directory secrets",
];

export const AZURE_CLOUD_CONNECTION_CANNOT_DO: readonly string[] = [
  "Create, update, or delete Azure resources",
  "Deploy templates or infrastructure changes",
  "Change role assignments or directory permissions",
  "Read secrets from Key Vault",
  "Access workload data inside storage accounts, databases, or virtual machines",
];

export const AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE = {
  recommendedTier2:
    "Assign Reader at the subscription scope for each subscription ArchLucid should connect. Assign Cost Management Reader only when cost evidence is required and an Azure admin can grant it.",
  resourceGroupLimitation:
    "Resource-group-only assignments are supported by the Tier 1 manual extractor script, not by the hosted Tier 2 connection API (subscription GUIDs only).",
  managementGroupLimitation:
    "Management-group inventory is supported by the Tier 1 manual script only. Hosted Tier 2 connections are configured per subscription.",
  multipleSubscriptions:
    "Assign roles on each subscription you connect. One ArchLucid connection record can list multiple subscription IDs when your workspace connects to more than one subscription.",
  billingScope:
    "Cost Management Reader is assigned at the subscription resource scope in ArchLucid onboarding templates — not at a separate billing-account scope.",
} as const;

export const AZURE_CLOUD_CONNECTION_IDENTITY_MODEL = {
  customerPrincipalLabel: "Enterprise application (service principal)",
  assignmentTarget:
    "Assign roles to the service principal object ID for the ArchLucid read-only enterprise application in your tenant.",
  federation:
    "Add a federated identity credential on the application registration that trusts ArchLucid's managed identity — no long-lived client secrets are stored in ArchLucid.",
  storedMetadata: "Tenant ID, application (client) ID, and subscription ID(s) only",
} as const;

export const AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR = {
  endpoint: "POST /v1/admin/azure-extractor/hosted/run",
  checks: [
    "Workload identity federation token exchange",
    "Reader access to list subscription resources",
    "Packaged inventory ingest into the workspace",
  ],
  doesNotVerify: [
    "Cost Management Reader assignment (hosted collector does not call cost APIs today)",
    "Policy Insights POST permissions on the hosted path",
  ],
} as const;

export const AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS: readonly string[] = [
  "Role assignment has not propagated yet — wait and retry verification.",
  "The role was assigned to the wrong identity — confirm the service principal object ID.",
  "The role was assigned at the wrong scope — use subscription scope for hosted Tier 2 connections.",
  "The selected subscription is outside the tenant configured on the connection.",
  "Cost Management Reader was assigned at billing-account scope — ArchLucid onboarding uses subscription scope.",
  "A conditional access or tenant policy blocks federated token exchange for the application.",
];

export const AZURE_CLOUD_CONNECTION_RELATED_HELP = [
  { label: "Connect Azure securely", href: "/help/cloud-connections/azure", provider: "azure" as const },
  { label: "AWS connection permissions", href: "/help/cloud-connections/aws", provider: "aws" as const },
  { label: "Google Cloud connection permissions", href: "/help/cloud-connections/gcp", provider: "gcp" as const },
] as const;
