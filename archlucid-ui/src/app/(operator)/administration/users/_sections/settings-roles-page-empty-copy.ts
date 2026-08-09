import type { SettingsRolesPageNote } from "./settings-roles-page-types";

export function settingsRolesEmptyStateTitle(kind: SettingsRolesPageNote): string {
  if (kind === "api_unavailable") {
    return "Member directory unavailable";
  }

  if (kind === "empty_response") {
    return "No members yet";
  }

  return "Could not load members";
}

export function settingsRolesEmptyStateDescription(kind: SettingsRolesPageNote): string {
  if (kind === "api_unavailable") {
    return "The workspace member list could not be loaded. You can still send invitations; retry when you need to review existing members.";
  }

  if (kind === "empty_response") {
    return "People appear here after they accept an invitation. Pending invitations are listed above.";
  }

  return "Check your connection and reload. Contact support if the problem continues.";
}
