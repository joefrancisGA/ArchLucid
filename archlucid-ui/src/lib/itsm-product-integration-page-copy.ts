import {
  ITSM_PRODUCT_SMOKE_VERIFICATION_HREF,
} from "@/lib/itsm-connectors-admin-scope";

export type ItsmProductId = "jira" | "servicenow";

export const ITSM_INTEGRATION_READINESS_AFTER_LINK =
  "for status across ServiceNow, Jira, Teams, Slack, cloud connections, and webhooks.";

/** Full sentence for tests and docs — link target is Integration readiness. */
export const ITSM_INTEGRATION_READINESS_HELPER = `See Integration readiness ${ITSM_INTEGRATION_READINESS_AFTER_LINK}`;

export const ITSM_PLATFORM_OPERATOR_NOTES_SUMMARY = "Platform operator notes";

export const ITSM_PLATFORM_OPERATOR_NOTES_BODY =
  "Native ticket creation may require credentials configured by your platform team. Contact your administrator if connection checks fail.";

/** Shown above the primary CTA when credentials are missing and the caller can open admin ITSM (TB-1146). */
export const ITSM_NOT_CONFIGURED_ADMIN_LEAD =
  "{vendor} credentials are not configured for this workspace. Configure the connector in ITSM administration, then return here for tenant routing overrides.";

/** Shown when credentials are missing and the caller cannot open admin ITSM (TB-1146). */
export const ITSM_NOT_CONFIGURED_OPERATOR_LEAD =
  "{vendor} credentials are not configured for this workspace. Ask a platform administrator to configure the connector, or check Integration readiness for status across outbound integrations.";

export const ITSM_NOT_CONFIGURED_READINESS_CTA = "Open Integration readiness";

/** Shown in Connection test before an explicit run when credentials are missing (TB-1148). */
export const ITSM_CONNECTION_TEST_UNAVAILABLE_UNTIL_CONFIGURED =
  "Connection test is unavailable until credentials are configured.";

/** Collapsed tenant overrides summary when credentials are missing (TB-1150). */
export const ITSM_TENANT_OVERRIDES_COLLAPSED_SUMMARY =
  "Optional routing (available after connection)";

/** Helper inside collapsed tenant overrides when credentials are missing (TB-1150). */
export const ITSM_TENANT_OVERRIDES_UNAVAILABLE_LEAD =
  "Configure credentials before saving tenant routing overrides for this workspace.";

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
      "Configure Jira outbound ticket routing for this workspace — project key, severity filters, and issue-type mapping. Connection credentials are configured by your platform team in ITSM administration.",
    connectionTestLead: "Runs a read-only connection check for Jira.",
    smokeHelpHref: ITSM_PRODUCT_SMOKE_VERIFICATION_HREF,
    smokeHelpLabel: "Jira connection verification checklist",
  },
  servicenow: {
    pageTitle: "ServiceNow",
    summary:
      "Configure ServiceNow outbound incident routing for this workspace — tenant overrides for routing and CMDB behavior. Connection credentials are configured by your platform team in ITSM administration.",
    connectionTestLead: "Runs a read-only connection check for ServiceNow.",
    smokeHelpHref: ITSM_PRODUCT_SMOKE_VERIFICATION_HREF,
    smokeHelpLabel: "ServiceNow connection verification checklist",
  },
};

export function formatItsmNativeCreateReadyMessage(vendor: string): string {
  return ITSM_NATIVE_CREATE_READY_MESSAGE.replace("{vendor}", vendor);
}

type ItsmConnectionTestProbe = {
  readonly locallyConfigured: boolean;
  readonly reachable: boolean | null;
  readonly summary: string;
};

/** Buyer-safe connection-test result — never repeats the probe-card not-configured sentence (TB-1148). */
export function formatItsmConnectionTestResult(
  product: ItsmProductId,
  probe: ItsmConnectionTestProbe | null | undefined,
): string {
  if (probe === null || probe === undefined)
  {
    return "Connection test did not return a result.";
  }

  const vendor = ITSM_PRODUCT_PAGE_COPY[product].pageTitle;

  if (!probe.locallyConfigured)
  {
    return `Connection test could not complete — configure ${vendor} credentials in ITSM administration, then run the test again.`;
  }

  if (probe.reachable === true)
  {
    return formatItsmNativeCreateReadyMessage(vendor);
  }

  const summary = sanitizeItsmCustomerFacingProbeSummary(probe.summary, product);

  if (summary.length > 0)
  {
    return summary;
  }

  return `${vendor} connection check failed.`;
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
