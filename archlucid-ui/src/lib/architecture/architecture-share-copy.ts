export const ARCHITECTURE_IDENTITY_DESK_SHARE_TITLE = "Architecture sharing" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_HELPER =
  "Restrict-to-shares hides this package from workspace members who are not on the share list. Sharing stays inside this tenant." as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_LOADING_LABEL = "Loading share settings…" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_ERROR_LABEL = "Could not load share settings." as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_RETRY_LABEL = "Retry" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_RESTRICT_LABEL = "Restrict to shares" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_LABEL =
  "I understand this hides the package from unshared workspace members" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_ACTOR_LABEL = "User actor oid" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_ACTOR_PLACEHOLDER = "jwt:tenant-id:user-oid" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_ROLE_LABEL = "Share role" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_GRANT_LABEL = "Grant or update share" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_REMOVE_LABEL = "Remove" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_SAVE_RESTRICT_LABEL = "Save restrict setting" as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_EMPTY_ACTOR_REASON = "Enter a user actor oid before granting a share." as const;
export const ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_RESTRICT_REASON =
  "Confirm restrict-to-shares before saving." as const;

export const ARCHITECTURE_SHARE_ROLES = ["View", "Decide", "Admin"] as const;

export type ArchitectureShareRole = (typeof ARCHITECTURE_SHARE_ROLES)[number];
