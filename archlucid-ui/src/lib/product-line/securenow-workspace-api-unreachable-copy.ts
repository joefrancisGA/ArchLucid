/** Shown when a SecureNow Home query fails, so a zero count is not mistaken for an empty workspace. */
export const SECURENOW_COLLECTION_SETUP_API_UNREACHABLE =
  "Workspace API is unreachable, so collection setup cannot be counted." as const;

export const SECURENOW_RETURN_HOME_API_UNREACHABLE =
  "Workspace API is unreachable, so unfinished work cannot be listed. This is not a usage claim." as const;
