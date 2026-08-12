/** System-admin-only Jira and ServiceNow connector surface (not on buyer Integrations nav). */
import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_READINESS_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";

import { INTERNAL_ITSM_CONNECTORS_PATH } from "@/lib/internal-ops-route-paths";

export const ITSM_CONNECTORS_ADMIN_PATH = INTERNAL_ITSM_CONNECTORS_PATH;

export const ITSM_CONNECTORS_ADMIN_LABEL = "ITSM connectors";

export const ITSM_CONNECTORS_ADMIN_SUMMARY =
  "Configure Jira and ServiceNow outbound create and inbound status sync for employee connector onboarding. Buyer Integrations stays export-first — use this page for deployment credentials and tenant routing overrides.";

export const ITSM_CONNECTORS_PAGE_CONFIG_CARD_TITLE = "What this page configures";

export const ITSM_CONNECTORS_NATIVE_ENABLED_MESSAGE =
  "Native outbound create is enabled for this deployment.";

export const ITSM_CONNECTORS_NATIVE_DISABLED_MESSAGE =
  "Native outbound create is disabled for this deployment (clipboard export still available). Ask a platform administrator to enable one-click Jira/ServiceNow create after smoke validation.";

export const ITSM_CONNECTORS_WIZARD_PREREQUISITES_DESCRIPTION =
  "Outbound credentials are configured by your platform team — this wizard only saves per-tenant routing overrides.";

export const ITSM_CONNECTORS_WIZARD_NATIVE_DISABLED_MESSAGE =
  "Native outbound create is disabled for this deployment. Ask a platform administrator to enable one-click Jira/ServiceNow create after smoke validation. Clipboard export and ITSM ticket linkages remain enabled.";

export const ITSM_CONNECTORS_JIRA_CREDENTIALS_NOT_CONFIGURED =
  "not configured — ask a platform administrator to add Jira credentials";

export const ITSM_CONNECTORS_SERVICENOW_CREDENTIALS_NOT_CONFIGURED =
  "not configured — ask a platform administrator to add ServiceNow credentials";

export const ITSM_CONNECTORS_CREDENTIALS_CONFIGURED_HEALTH_FALLBACK =
  "configured — validated by connector health check";

/** Regression guard — appsettings keys and V1-window chrome must not render on admin ITSM surfaces (TB-1430). */
export const ITSM_CONNECTORS_ADMIN_BANNED_SUBSTRINGS: readonly string[] = [
  "Integrations:Itsm",
  "V1 scope",
  "System Administration",
  "internal V1 rollout",
] as const;

/** Smoke runbook destinations for ITSM admin onboarding — product paths, not generic troubleshooting (TB-1433). */
export const ITSM_CONNECTOR_SMOKE_HELP = {
  jira: INTEGRATIONS_JIRA_PATH,
  serviceNow: INTEGRATIONS_SERVICENOW_PATH,
  scaffold: INTEGRATIONS_READINESS_PATH,
} as const;

/** Regression guard — smoke CTAs must not dump into customer troubleshooting (TB-1433). */
export const ITSM_CONNECTOR_SMOKE_HELP_BANNED_HREFS: readonly string[] = ["/help/troubleshooting"] as const;

/** Buyer product integration pages use the readiness hub for connection verification next steps (TB-1433). */
export const ITSM_PRODUCT_SMOKE_VERIFICATION_HREF = INTEGRATIONS_READINESS_PATH;
