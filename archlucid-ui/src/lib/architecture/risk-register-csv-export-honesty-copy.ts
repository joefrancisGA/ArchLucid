export const RISK_REGISTER_CSV_EXPORT_HARD_FAILURE_LINE =
  "Risk register CSV export failed in the browser. That is a hard export failure — the register itself may still have rows." as const;

export const RISK_REGISTER_CSV_EXPORT_EMPTY_NOT_FAILURE_LINE =
  "Export CSV with no visible rows writes a header-only file. That is an empty register export — the download did not fail." as const;
