import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";

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

/** Users tab collection empty (stacked members card — not invite-first composition). */
export const SETTINGS_ROLES_USERS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "settings-roles-users-empty-state",
  title: settingsRolesEmptyStateTitle("empty_response", "users"),
  description: settingsRolesEmptyStateDescription("empty_response", "users"),
};

/** API keys tab collection empty (role assignment directory). */
export const SETTINGS_ROLES_API_KEYS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "settings-roles-api-keys-empty-state",
  title: settingsRolesEmptyStateTitle("empty_response", "api_keys"),
  description: settingsRolesEmptyStateDescription("empty_response", "api_keys"),
};
