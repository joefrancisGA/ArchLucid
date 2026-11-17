/** Compliance drift trend buckets reflect stored events; partial capture can thin daily counts. */
export const SPONSOR_COMPLIANCE_DRIFT_PARTIAL_WINDOW_LINE =
  "Daily drift buckets use stored compliance events in the window. Partial inventory capture can thin counts — not proof drift stopped." as const;