export type AdminUsersDirectoryRow = {
  userId: string;
  displayName: string;
  email: string;
  authorityLabel: string;
};

/** Error / empty-result states surfaced as product copy (not developer diagnostics). */
export type AdminUsersNote = "api_unavailable" | "empty_response" | "load_failed";
