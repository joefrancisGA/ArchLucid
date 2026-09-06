export const SETTINGS_ROLES_SETTINGS_PRIMARY_CONTENT_ID = "settings-roles-primary-content" as const;

export const SETTINGS_ROLES_SETTINGS_FIRST_VIEWPORT_TEST_ID = "settings-roles-first-viewport" as const;

export const SETTINGS_ROLES_SETTINGS_SKIP_TARGET_ID = SETTINGS_ROLES_SETTINGS_FIRST_VIEWPORT_TEST_ID;

export const SETTINGS_ROLES_SETTINGS_SKIP_LINK_LABEL = "Skip to users and roles workspace" as const;

export const SETTINGS_ROLES_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "settings-roles-header-claim-discipline" as const;

export const SETTINGS_ROLES_PAGE_SUBTITLE_OPERATOR =
  "Invite users, assign roles, and manage workspace access." as const;

export const SETTINGS_ROLES_PAGE_SUBTITLE_BUYER =
  "Invite workspace members, assign roles, and review who can access reviews and governance actions." as const;

export const SETTINGS_ROLES_START_HERE_CARD_TITLE = "Start here" as const;

export const SETTINGS_ROLES_START_HERE_LEAD =
  "Invite a workspace member first, then assign roles or review the permissions matrix when your directory is ready." as const;

export const SETTINGS_ROLES_ROLES_TAB_SUBTITLE_BUYER =
  "Review built-in and custom role permissions — role edits stay in the full admin workspace." as const;

export const SETTINGS_ROLES_ROLES_TAB_LEAD =
  "Read-only view of built-in role summaries and the permissions matrix for procurement walkthroughs." as const;

export const SETTINGS_ROLES_ROLES_TAB_START_HERE_HELPER =
  "Scan built-in role cards and the matrix below. Create, clone, and save actions are hidden in buyer-polished shells." as const;

export function settingsRolesPageSubtitle(buyerPolishedShell: boolean, activeTab: "users" | "roles" | "keys" = "users"): string {
  if (!buyerPolishedShell) {
    return SETTINGS_ROLES_PAGE_SUBTITLE_OPERATOR;
  }

  if (activeTab === "roles") {
    return SETTINGS_ROLES_ROLES_TAB_SUBTITLE_BUYER;
  }

  return SETTINGS_ROLES_PAGE_SUBTITLE_BUYER;
}
