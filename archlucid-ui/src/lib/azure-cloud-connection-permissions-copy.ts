export const AZURE_PERMISSIONS_PAGE_TITLE = "Azure permissions for cloud connections";

export const AZURE_PERMISSIONS_PAGE_SUBTITLE =
  "Grant ArchLucid the minimum read-only access needed to collect architecture and, when enabled, cost evidence from Azure.";

export const AZURE_PERMISSIONS_BACK_TO_CONNECTIONS = "Back to cloud connections";

export const AZURE_PERMISSIONS_READ_ONLY_HEADING = "Read-only by design";

export const AZURE_PERMISSIONS_READ_ONLY_INTRO =
  "ArchLucid uses Azure permissions to collect architecture evidence. It does not require Owner, Contributor, User Access Administrator, or other write-enabled roles.";

export const AZURE_PERMISSIONS_COST_OPTIONAL_NOTE =
  "Cost access is optional and is required only when cost analysis is enabled for the connection or when you collect cost data with the optional local Azure inventory script.";

export const AZURE_PERMISSIONS_TRUST_NO_MODIFY = "No resource modification";

export const AZURE_PERMISSIONS_TRUST_NO_ROLE_ASSIGN = "No role assignment";

export const AZURE_PERMISSIONS_TRUST_NO_DEPLOY = "No deployment access";

export const AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_HEADING = "Roles to assign first";

export const AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_INTRO =
  "Assign Reader at subscription scope before opening the full permission matrix. Add Cost Management Reader only when cost analysis is enabled.";

export const AZURE_PERMISSIONS_MATRIX_HEADING = "Required and optional permissions";

export const AZURE_PERMISSIONS_MATRIX_DISCLOSURE_SUMMARY =
  "Full role matrix, per-role capabilities, and assignment scopes.";

export const AZURE_PERMISSIONS_CUSTOM_ROLE_DISCLOSURE_SUMMARY =
  "Custom-role read actions when built-in roles are not permitted.";

export const AZURE_PERMISSIONS_SCOPE_HEADING = "Choose the narrowest practical scope";

export const AZURE_PERMISSIONS_SETUP_HEADING = "Assign the Azure roles";

export const AZURE_PERMISSIONS_PORTAL_TAB = "Azure portal";

export const AZURE_PERMISSIONS_CLI_TAB = "Azure CLI";

export const AZURE_PERMISSIONS_COLLECTED_HEADING = "Information ArchLucid collects";

export const AZURE_PERMISSIONS_CANNOT_DO_HEADING = "Actions these permissions do not allow";

export const AZURE_PERMISSIONS_CANNOT_DO_INTRO =
  "ArchLucid requests no Azure write-enabled role for this connection. Reader can still expose resource configuration metadata — review the collected categories below before approving access.";

export const AZURE_PERMISSIONS_CUSTOM_ROLE_HEADING = "Using a custom Azure role";

export const AZURE_PERMISSIONS_CUSTOM_ROLE_INTRO =
  "Organizations that prohibit built-in roles may create a custom role that includes only the read actions listed below. Test the role in a non-production subscription before production rollout.";

export const AZURE_PERMISSIONS_VERIFY_HEADING = "Verify the connection";

export const AZURE_PERMISSIONS_VERIFY_INTRO =
  "After assigning roles, save the connection in ArchLucid and run a validation pull to confirm federated credentials and Reader access.";

export const AZURE_PERMISSIONS_TROUBLESHOOT_HEADING = "Troubleshoot permission checks";

export const AZURE_PERMISSIONS_CONNECTION_CONTEXT_HEADING = "Connection values";

export const AZURE_PERMISSIONS_OTHER_PROVIDERS_HEADING = "Other cloud providers";

/** @deprecated Header chrome — use `formatAzurePermissionsHelpRequirementsReviewedLine` in the reviewed disclosure (TB-1628). */
export const AZURE_PERMISSIONS_REVISION_NOTE = (version: string): string =>
  `Permission requirements last verified for ArchLucid release contract ${version}.`;

export const AZURE_PERMISSIONS_CONTEXT_MISSING =
  "Open the Azure connection setup to view the principal, tenant, and subscription scope for your workspace.";
