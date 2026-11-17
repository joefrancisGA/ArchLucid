/** Blocked review exports when workspace inventory capture had gaps. */
export const EXPORT_PARTIAL_CAPTURE_RECOVERY_MIDDLE_LINE =
  "Findings-backed exports may omit unscanned resources until cloud connections or extract upload recovery succeeds — fix capture gaps before treating blocked exports as seal or commit issues only." as const;