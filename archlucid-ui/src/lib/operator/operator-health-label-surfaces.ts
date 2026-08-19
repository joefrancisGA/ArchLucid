/**
 * Operator-facing health label modules scanned by {@link ./operator-health-label-guard.test.ts}.
 * Admin diagnostics (`/internal/health`, `/administration/system-health` dependency tables) intentionally allow infra names.
 */
export const OPERATOR_HEALTH_LABEL_EXPORTS = [
  "SERVICE_BUS_HEALTH_LABELS",
  "DATA_ARCHIVAL_HEALTH_LABELS",
  "WORKSPACE_SETUP_HEALTH_LABELS",
  "POST_COMMIT_INTEGRATION_LINK_TITLES",
] as const;

/** Lowercase fragments that must not appear in operator health label constants (TB-650). */
export const OPERATOR_HEALTH_LABEL_BANNED_PATTERNS = [
  "service bus",
  "worker log",
  "azure_service_bus",
  "readiness check",
  "smoke signal",
  "service bus posture",
] as const;
