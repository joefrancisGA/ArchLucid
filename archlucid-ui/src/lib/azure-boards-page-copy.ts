export const AZURE_BOARDS_PAGE_TITLE = "Azure Boards";

export const AZURE_BOARDS_PAGE_DESCRIPTION =
  "Connect an Azure DevOps organization and create work items from ArchLucid findings.";

export const AZURE_BOARDS_PAGE_CLOUD_NEUTRALITY_NOTE =
  "Azure Boards is work management — it is independent of whether your architecture runs on Azure, AWS, or Google Cloud.";

export const AZURE_BOARDS_CONNECTION_STATUS_HEADING = "Connection status";

export const AZURE_BOARDS_CONNECTION_SETTINGS_TITLE = "Connection settings";

export const AZURE_BOARDS_CONNECTION_SETTINGS_LEAD =
  "Connect your Azure DevOps organization with a personal access token stored as a secure reference. Token values are never shown after they are saved.";

export const AZURE_BOARDS_DEFAULT_BEHAVIOR_TITLE = "Default work item behavior";

export const AZURE_BOARDS_DEFAULT_BEHAVIOR_LEAD =
  "Choose the project and work item type ArchLucid uses when creating work items from findings.";

export const AZURE_BOARDS_TEST_CONNECTION_TITLE = "Test connection";

export const AZURE_BOARDS_TEST_CONNECTION_LEAD =
  "Runs a read-only check against Azure DevOps — no work item is created.";

export const AZURE_BOARDS_TEST_CONNECTION_LABEL = "Test connection";

export const AZURE_BOARDS_TEST_CONNECTION_PENDING = "Testing connection…";

export const AZURE_BOARDS_SAVE_SETTINGS_LABEL = "Save settings";

export const AZURE_BOARDS_SAVING_SETTINGS_LABEL = "Saving settings…";

export const AZURE_BOARDS_RELOAD_BUTTON = "Reload";

export const AZURE_BOARDS_SAVE_SUCCESS = "Settings saved.";

export const AZURE_BOARDS_SAVE_CONNECTION_LABEL = "Save connection";

export const AZURE_BOARDS_SAVING_CONNECTION_LABEL = "Saving connection…";

export const AZURE_BOARDS_FIELD_ORGANIZATION_URL = "Organization URL";

export const AZURE_BOARDS_FIELD_TOKEN_REFERENCE = "Token secure reference";

export const AZURE_BOARDS_FIELD_CREDENTIAL_STATUS = "Credential status";

export const AZURE_BOARDS_FIELD_PROJECT = "Project";

export const AZURE_BOARDS_FIELD_WORK_ITEM_TYPE = "Work item type";

export const AZURE_BOARDS_FIELD_AREA_PATH = "Area path (optional)";

export const AZURE_BOARDS_FIELD_ITERATION_PATH = "Iteration path (optional)";

export const AZURE_BOARDS_FIELD_DEFAULT_TAGS = "Default tags (optional)";

export const AZURE_BOARDS_ORGANIZATION_URL_PLACEHOLDER = "https://dev.azure.com/your-organization";

export const AZURE_BOARDS_TOKEN_REFERENCE_PLACEHOLDER = "Key Vault secret name for PAT";

export const AZURE_BOARDS_LOADING_MESSAGE = "Loading Azure Boards configuration…";

export const AZURE_BOARDS_DOCUMENTATION_ASIDE_TITLE = "Documentation";

export const AZURE_BOARDS_PERMISSIONS_ASIDE_TITLE = "Required permissions";

export const AZURE_BOARDS_PERMISSIONS_ASIDE_BODY =
  "The personal access token needs read access to projects and work item types, plus permission to create work items in the selected project. Repository, pipeline, and release permissions are not required.";

export const AZURE_BOARDS_SETUP_PROGRESS_TITLE = "Setup progress";

export const AZURE_BOARDS_LATEST_TEST_TITLE = "Latest connection test";

export const AZURE_BOARDS_CONNECTION_VERIFICATION_HELP_LABEL = "Azure Boards connection verification checklist";

export const AZURE_BOARDS_MUTATION_DISABLED_HELPER =
  "You need workspace administrator permissions to change Azure Boards settings.";

export const AZURE_BOARDS_BANNED_UI_PATTERNS = [
  /_apis\/wit/i,
  /json-patch/i,
  /api-version/i,
  /dbo\./i,
  /CredentialKeyVaultSecretName/i,
  /routingSubscriptionId/i,
  /ADO\b/i,
] as const;
