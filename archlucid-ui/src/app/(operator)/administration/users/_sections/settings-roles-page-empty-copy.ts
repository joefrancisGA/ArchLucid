import type { SettingsRolesPageNote } from "./settings-roles-page-types";

export type SettingsRolesEmptySurface = "users" | "api_keys";

export function settingsRolesEmptyStateTitle(
  kind: SettingsRolesPageNote,
  surface: SettingsRolesEmptySurface,
): string {
  if (kind === "api_unavailable") {
    if (surface === "api_keys") {
      return "API key directory unavailable";
    }

    return "Member directory unavailable";
  }

  if (kind === "empty_response") {
    if (surface === "api_keys") {
      return "No API keys yet";
    }

    return "No members yet";
  }

  if (surface === "api_keys") {
    return "Could not load API keys";
  }

  return "Could not load members";
}

export function settingsRolesEmptyStateDescription(
  kind: SettingsRolesPageNote,
  surface: SettingsRolesEmptySurface,
): string {
  if (kind === "api_unavailable") {
    if (surface === "api_keys") {
      return "The API key role list could not be loaded. You can still manage credentials under API keys; retry when you need to review automation roles.";
    }

    return "The workspace member list could not be loaded. You can still send invitations; retry when you need to review existing members.";
  }

  if (kind === "empty_response") {
    if (surface === "api_keys") {
      return "API keys appear here after keys are created and assigned a role.";
    }

    return "People appear here after they accept an invitation. Send an invite or review pending invitations from this page.";
  }

  if (surface === "api_keys") {
    return "The API key role list could not be loaded. Check your connection and reload, or manage credentials under API keys.";
  }

  return "The workspace member list could not be loaded. Check your connection and reload. Contact support if the problem continues.";
}
