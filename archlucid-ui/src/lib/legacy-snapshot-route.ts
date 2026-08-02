/** Legacy marketing leave-behind prefix — App Router shim forwards to review workspace (TB-1951). */
export const LEGACY_SNAPSHOT_PATH_PREFIX = "/snapshot";

/** Traffic workbook path pattern for the snapshot redirect shim. */
export const LEGACY_SNAPSHOT_PATH_PATTERN = "/snapshot/[runId]";

/**
 * Inbound marketing query keys on `/snapshot/...` are forwarded by `buildSnapshotRedirectPath`
 * (for example `?v=demo` on CTO recap links). The shim stays on App Router — no `next.config`
 * redirect — because destination varies by showcase alias and `readOnly=1` must be injected (TB-1953).
 */
export const LEGACY_SNAPSHOT_INBOUND_QUERY_POLICY_NOTE =
  "Inbound query params (for example v=demo) are preserved on redirect; readOnly=1 is always set.";
