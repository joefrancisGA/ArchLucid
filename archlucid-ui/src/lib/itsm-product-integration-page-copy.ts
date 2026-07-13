import { ITSM_CONNECTOR_SMOKE_HELP } from "@/lib/itsm-connectors-admin-scope";

export type ItsmProductId = "jira" | "servicenow";

export const ITSM_INTEGRATION_READINESS_AFTER_LINK =
  "for status across ServiceNow, Jira, Teams, Slack, cloud connections, and webhooks.";

/** Full sentence for tests and docs — link target is Integration readiness. */
export const ITSM_INTEGRATION_READINESS_HELPER = `See Integration readiness ${ITSM_INTEGRATION_READINESS_AFTER_LINK}`;

export const ITSM_PLATFORM_OPERATOR_NOTES_SUMMARY = "Platform operator notes";

export const ITSM_PLATFORM_OPERATOR_NOTES_BODY =
  "Native ticket creation may require credentials configured by your platform team. Contact your administrator if connection checks fail.";

export const ITSM_NATIVE_CREATE_READY_MESSAGE =
  "Connection validation passed — finding surfaces can offer one-click {vendor} sync when outbound creation is enabled.";

export type ItsmProductPageCopy = {
  readonly pageTitle: string;
  readonly summary: string;
  readonly connectionTestLead: string;
  readonly smokeHelpHref: string;
  readonly smokeHelpLabel: string;
};

export const ITSM_PRODUCT_PAGE_COPY: Record<ItsmProductId, ItsmProductPageCopy> = {
  jira: {
    pageTitle: "Jira",
    summary:
      "Configure Jira outbound ticket creation from architecture findings. Set connection details and routing preferences for this workspace.",
    connectionTestLead: "Runs a read-only connection check for Jira.",
    smokeHelpHref: ITSM_CONNECTOR_SMOKE_HELP.jira,
    smokeHelpLabel: "Jira connection verification checklist",
  },
  servicenow: {
    pageTitle: "ServiceNow",
    summary:
      "Configure ServiceNow outbound incident creation from architecture findings. Set connection details and routing preferences for this workspace.",
    connectionTestLead: "Runs a read-only connection check for ServiceNow.",
    smokeHelpHref: ITSM_CONNECTOR_SMOKE_HELP.serviceNow,
    smokeHelpLabel: "ServiceNow connection verification checklist",
  },
};

export function formatItsmNativeCreateReadyMessage(vendor: string): string {
  return ITSM_NATIVE_CREATE_READY_MESSAGE.replace("{vendor}", vendor);
}

const ITSM_INTERNAL_PROBE_SUMMARY_PATTERN =
  /Integrations:ItsmOutbound|host configuration|Key Vault materialization|tenant SQL|vendor probes?/i;

/** Maps deployment-operator health probe text to buyer-safe summaries (TB-767). */
export function sanitizeItsmCustomerFacingProbeSummary(
  summary: string | null | undefined,
  product: ItsmProductId,
): string {
  const text = (summary ?? "").trim();
  const vendor = ITSM_PRODUCT_PAGE_COPY[product].pageTitle;

  if (text.length === 0) {
    return "";
  }

  if (/Integrations:ItsmOutbound/i.test(text)) {
    return `${vendor} credentials are not configured for this workspace.`;
  }

  if (ITSM_INTERNAL_PROBE_SUMMARY_PATTERN.test(text)) {
    return `${vendor} connection check could not complete with the current configuration.`;
  }

  return text;
}
