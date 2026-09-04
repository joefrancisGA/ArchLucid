/**
 * Operator-facing health label dictionaries (TB-650) — dependency-free leaf module so client
 * banners and strips never depend on `@/lib/i18n` module-evaluation order under Turbopack.
 * `@/lib/i18n` re-exports these for existing consumers.
 */
export const SERVICE_BUS_HEALTH_LABELS = {
  bannerTitle: "Review processing is delayed",
  bannerBody:
    "Results may take longer than usual. Contact your ArchLucid administrator if this persists.",
  systemHealthLink: "System health",
  systemHealthHref: "/administration/system-health",
  internalHealthLink: "Internal readiness probe",
  internalHealthHref: "/internal/health",
  refreshFailedTitle: "Review processing status unavailable",
  refreshFailedBodyDegraded:
    "Could not refresh processing status. Showing the last known delayed state until refresh succeeds.",
  refreshFailedBodyUnknown:
    "Could not confirm review processing readiness. Retry before assuming reviews are healthy.",
  technicalProbeDisclosure: "Technical detail: azure_service_bus readiness probe.",
} as const;

export const DATA_ARCHIVAL_HEALTH_LABELS = {
  bannerTitle: "Retention history may be incomplete",
  bannerBody:
    "Approval metrics in this workspace may be stale until background retention catches up. Contact your ArchLucid administrator if this persists.",
  systemHealthLink: "System health",
  homeStripLabel: "Retention history",
} as const;

export const WORKSPACE_SETUP_HEALTH_LABELS = {
  unknownBody: "Some workspace services are unavailable.",
  attentionBody: "Finish workspace setup before starting reviews.",
  troubleshootingLink: "Open troubleshooting",
  systemHealthLink: "system health",
} as const;

export const POST_COMMIT_INTEGRATION_LINK_TITLES = {
  mutate: "Connection status and integration health",
  readOnly: "View connection status (read-only at your rank)",
} as const;
