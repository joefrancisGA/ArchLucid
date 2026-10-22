/** Relative to repository root (parent of archlucid-ui). */
export const DAYTIME_WAIT_ADR_0096_RELATIVE_PATH =
  "docs/architecture/adrs/0096-career-real-never-owns-the-tab.md" as const;

export const DAYTIME_WAIT_ADR_0096_ACCEPTED_STATUSES = ["Accepted"] as const;

/** Forbidden progress URL — must not appear in client API paths (DW-014 / DW-018). */
export const DAYTIME_WAIT_FORBIDDEN_RUN_PROGRESS_URL_FRAGMENT = "/v1/runs/{runId}/progress" as const;
