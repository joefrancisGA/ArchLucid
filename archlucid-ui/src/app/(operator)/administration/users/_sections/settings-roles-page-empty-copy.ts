import type { SettingsRolesPageNote } from "./settings-roles-page-types";

export function settingsRolesEmptyStateTitle(kind: SettingsRolesPageNote): string {
  if (kind === "api_unavailable") {
    return "Directory unavailable";
  }

  if (kind === "empty_response") {
    return "No principals found";
  }

  return "Could not load principals";
}

export function settingsRolesEmptyStateDescription(kind: SettingsRolesPageNote): string {
  if (kind === "api_unavailable") {
    return "The user directory could not be loaded. Contact your workspace administrator if this persists.";
  }

  if (kind === "empty_response") {
    return "No users or API keys were returned for this tenant.";
  }

  return "Check your connection and reload. Contact support if the problem continues.";
}
