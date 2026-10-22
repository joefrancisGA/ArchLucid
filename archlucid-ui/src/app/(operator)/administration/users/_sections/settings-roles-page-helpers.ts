import { SETTINGS_ROLES_KEYS_TAB_LABEL } from "./settings-roles-page-keys-tab-copy";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";
import type { SettingsUsersTabId } from "@/lib/settings-admin-route-paths";

export const ALL_TABS: readonly { id: SettingsUsersTabId; label: string }[] = [
  { id: "users", label: "Users and invitations" },
  { id: "roles", label: "Roles and permissions" },
  { id: "keys", label: SETTINGS_ROLES_KEYS_TAB_LABEL },
] as const;

export const MEMBERS_HEADING_ID = "settings-roles-members-heading";
export const PENDING_INVITATIONS_HEADING_ID = "settings-roles-pending-invitations-heading";
export const INVITE_SECTION_SUMMARY_ID = "settings-roles-invite-section-summary";
export const INVITE_PRIMARY_HEADING_ID = "settings-roles-invite-primary-heading";

export function visibleTabs(canManageApiKeys: boolean): readonly { id: SettingsUsersTabId; label: string }[] {
  if (canManageApiKeys) {
    return ALL_TABS;
  }

  return ALL_TABS.filter((tab) => tab.id !== "keys");
}

export function directoryNoteReliableForAssignmentCounts(note: SettingsRolesPageViewModel["usersNote"]): boolean {
  return note === null || note === "empty_response";
}

/** Predicate, not a plain boolean, so callers can pass the narrowed note to the copy helpers. */
export function isUsersNoteLoadFailure(
  note: SettingsRolesPageViewModel["usersNote"],
): note is "api_unavailable" | "load_failed" {
  return note === "api_unavailable" || note === "load_failed";
}

export function isKeysNoteLoadFailure(
  note: SettingsRolesPageViewModel["keysNote"],
): note is "api_unavailable" | "load_failed" {
  return note === "api_unavailable" || note === "load_failed";
}

export function isKeysDirectoryCollectionEmpty(
  keysNote: SettingsRolesPageViewModel["keysNote"],
  apiKeyCount: number,
): boolean {
  return apiKeyCount === 0 && (keysNote === null || keysNote === "empty_response");
}
