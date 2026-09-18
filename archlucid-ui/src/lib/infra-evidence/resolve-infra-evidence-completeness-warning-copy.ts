import { AzureInventoryRelationshipCompletenessWarningCodes } from "./azure-inventory-completeness-warning-codes";

export type InfraEvidenceCompletenessWarningPresentation = {
  readonly code: string;
  readonly title: string;
  readonly detail: string;
};

const HOSTED_APP_SETTINGS_WARNING =
  "app-settings-not-collected-hosted-get-only";

const RBAC_SCOPE_TOO_BROAD_PREFIX = "rbac-scope-too-broad:";

export function resolveInfraEvidenceCompletenessWarningPresentation(
  warning: string,
): InfraEvidenceCompletenessWarningPresentation {
  const trimmed = warning.trim();

  if (trimmed === HOSTED_APP_SETTINGS_WARNING) {
    return {
      code: trimmed,
      title: "App setting hostnames not collected on hosted pull",
      detail:
        "Hosted inventory uses GET-only ARM calls and does not read app settings. Re-run the Tier 1 PowerShell package with -IncludeAppSettingsHosts to add redacted hostname hints (never values).",
    };
  }

  if (trimmed.startsWith(RBAC_SCOPE_TOO_BROAD_PREFIX)) {
    const scope = trimmed.slice(RBAC_SCOPE_TOO_BROAD_PREFIX.length);

    return {
      code: trimmed,
      title: "Role assignment scope is too broad for per-resource edges",
      detail: `A managed identity role is scoped at ${scope}. App-to-resource authorization edges were not expanded to every child resource.`,
    };
  }

  if (trimmed.startsWith(`${AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsHostUnresolved}:`)) {
    return {
      code: trimmed,
      title: "App setting hostname could not be matched to inventory",
      detail: "A hostname from Tier 1 app settings did not resolve to a single Azure resource in this snapshot.",
    };
  }

  return {
    code: trimmed,
    title: "Inventory completeness note",
    detail: trimmed,
  };
}

export function snapshotIncludesTier1AppSettingHosts(
  warnings: readonly string[],
): boolean {
  return !warnings.some((warning) => warning.trim() === HOSTED_APP_SETTINGS_WARNING);
}
