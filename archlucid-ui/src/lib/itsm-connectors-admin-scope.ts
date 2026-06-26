/** System-admin-only Jira and ServiceNow connector surface (V1 GA — not on buyer Integrations nav). */
export const ITSM_CONNECTORS_ADMIN_PATH = "/admin/integrations/itsm";

export const ITSM_CONNECTORS_ADMIN_LABEL = "ITSM connectors";

export const ITSM_CONNECTORS_ADMIN_SUMMARY =
  "Configure Jira and ServiceNow outbound create and inbound status sync for internal V1 rollout. System Administration only — buyer Integrations stays export-first.";

/** In-app help entry points for connector smoke validation (operator runbooks). */
export const ITSM_CONNECTOR_SMOKE_HELP = {
  jira: "/help/troubleshooting",
  serviceNow: "/help/troubleshooting",
  scaffold: "/help/troubleshooting",
} as const;
