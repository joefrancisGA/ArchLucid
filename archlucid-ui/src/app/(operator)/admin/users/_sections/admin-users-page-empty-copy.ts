import type { AdminUsersNote } from "./admin-users-page-types";

export function adminUsersEmptyStateTitle(kind: AdminUsersNote): string {
  if (kind === "api_unavailable") {
    return "User directory unavailable";
  }

  if (kind === "empty_response") {
    return "No users found";
  }

  return "Could not load users";
}

export function adminUsersEmptyStateDescription(kind: AdminUsersNote): string {
  if (kind === "api_unavailable") {
    return "The user list could not be loaded. Contact your workspace administrator if this persists.";
  }

  if (kind === "empty_response") {
    return "The directory returned no users for this tenant.";
  }

  return "Check your connection and reload. Contact support if the problem continues.";
}
