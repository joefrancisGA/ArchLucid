/** Concurrent core read failure — retry does not re-rank stored paths. */
export const REMEDIATION_FACTORY_CORE_READ_RETRY_RANK_UNCHANGED_LINE =
  "Retry reloads stored metrics and path lists in this tenant. A successful retry does not change stored path rank or Azure configuration." as const;