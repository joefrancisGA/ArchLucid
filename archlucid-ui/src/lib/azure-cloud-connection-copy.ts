/** Operator-facing copy for `/integrations/cloud-connections/azure` (TB-1766, TB-1767). */

export const AZURE_CLOUD_CONNECTION_BANNED_COPY = [
  "Evidence tier",
  "Tier 1",
  "Tier 2",
  "hosted pull",
  "hosted poll",
  "hosted validation",
  "Hosted Azure",
  "Hosted GCP poll",
  "validation pull",
  "hosted inventory pull",
  "hosted inventory package",
  "hosted collection",
] as const;

export const AZURE_CONNECTION_LOAD_FAILED_ERROR =
  "Could not load Azure connections. Check your permissions and try again.";

export const AZURE_CONNECTION_VALIDATE_EMPTY_STATE =
  "Save an Azure connection in Connection details before validating access.";

export const AZURE_CONNECTION_CONNECTED_SUMMARY_LEAD =
  "Your saved Azure connection is listed below. Validate to confirm federation access, or update identifiers when your tenant changes.";

export const AZURE_CONNECTION_UPDATE_BUTTON_LABEL = "Update connection";

export const AZURE_CONNECTION_CLIENT_APP_ID_LABEL = "Client/App ID";

export const AZURE_CONNECTION_CLIENT_APP_ID_TERM = "client/app ID";

export const AZURE_CONNECTION_CLIENT_APP_ID_HINT =
  "Application (client) ID on the app registration Overview page in Microsoft Entra. Azure CLI prints this as appId.";

export const AZURE_CONNECTION_TENANT_ID_LABEL = "Azure Tenant ID";

export const AZURE_CONNECTION_TENANT_ID_HINT =
  "Directory (tenant) ID for the Entra tenant that owns the app registration — not ArchLucid's tenant.";

export const AZURE_CONNECTION_SUBSCRIPTION_IDS_LABEL = "Subscription IDs";

export const AZURE_CONNECTION_SUBSCRIPTION_IDS_HINT =
  "Azure subscription GUIDs to inventory. Separate multiple IDs with commas.";

export const AZURE_CONNECTION_IDS_STEP_LEAD =
  `Paste the Azure tenant ID, ${AZURE_CONNECTION_CLIENT_APP_ID_TERM}, and comma-separated subscription IDs from your provisioning output. ArchLucid stores identifiers only — never client secrets.`;

export const AZURE_CONNECTION_ARCHLUCID_TENANT_ID_HINT =
  "Entra tenant ID ArchLucid uses for federation. Use this in the federated credential issuer, not your customer tenant ID.";

export const AZURE_CONNECTION_MANAGED_IDENTITY_OBJECT_ID_HINT =
  "Object ID of ArchLucid's managed identity. The federated credential subject must match this value.";

export const AZURE_CONNECTION_TENANT_ID_INVALID = "Enter a valid Azure tenant ID GUID.";

export const AZURE_CONNECTION_CLIENT_APP_ID_INVALID = "Enter a valid client/app ID GUID.";

export const AZURE_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE =
  "Save a connection and run Validate connection to import inventory.";

export function formatAzureConnectionValidationSuccessMessage(
  resourceCount: number,
  packageId: string,
): string {
  return `Validation completed (${resourceCount} resources imported as package ${packageId}).`;
}

export const AZURE_CONNECTION_SAVE_VALIDATE_LEAD =
  "Persist the connection for scheduled read-only inventory collection, then optionally validate access against the first subscription ID.";

export const AZURE_CONNECTION_POST_SAVE_VALIDATE_LEAD =
  "Validate connection to confirm ArchLucid can sign in with federation and list resources with Reader.";

export const AZURE_CONNECTION_VALIDATION_PREREQUISITES =
  "An Azure app registration alone is not enough. Before validating, confirm: (1) a federated credential on the app that trusts ArchLucid's managed identity, (2) Reader on the subscription, and (3) Azure inventory collection is enabled for this ArchLucid environment.";

export const AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED =
  "Administrator role required to run validation collection.";

export const AZURE_CONNECTION_VALIDATION_BUTTON_LABEL = "Validate connection";

export const AZURE_CONNECTION_VALIDATION_FALLBACK_ERROR =
  "Validation could not be completed. Confirm federated credentials, Reader on the subscription, and that Azure inventory collection is enabled for this environment — then try again.";

export const AZURE_CONNECTION_VALIDATION_DISABLED_ERROR =
  "Azure inventory collection is not enabled in this ArchLucid environment. Contact your ArchLucid administrator — an app registration in Azure cannot complete validation until collection is enabled.";

export const AZURE_CONNECTION_WIZARD_SAVE_STEP_DESCRIPTION = "Persist and validate";

export const AZURE_CONNECTION_SETUP_SCRIPT_VALIDATION_NOTE =
  "# Connection validation requires Reader only.";

export const AZURE_CONNECTION_SETUP_SCRIPT_FEDERATION_DESCRIPTION =
  "Trust ArchLucid federated identity";
