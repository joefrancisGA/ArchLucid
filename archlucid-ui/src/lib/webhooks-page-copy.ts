import type { WebhookSettingsFormValues } from "@/lib/webhook-settings-form-schema";
import { webhookSettingsFormSchema } from "@/lib/webhook-settings-form-schema";

export const WEBHOOKS_PAGE_TITLE = "Webhooks";

export const WEBHOOKS_PAGE_DESCRIPTION =
  "Send selected ArchLucid events to a secure HTTPS endpoint that you manage.";

export const WEBHOOKS_ABOUT_WHEN_TO_USE =
  "Use a webhook when you operate your own HTTPS receiver and need selected ArchLucid alert events delivered there.";

export const WEBHOOKS_ABOUT_WHAT_WE_SEND =
  "ArchLucid currently delivers alert lifecycle events you select below. Each delivery uses a JSON payload over HTTPS.";

export const WEBHOOKS_ABOUT_SECURITY =
  "Every delivery carries an HMAC signature header. ArchLucid stores the secret securely and never shows it again in this workspace.";

export const WEBHOOKS_ABOUT_DEVELOPERS =
  "Developers verify a delivery by recomputing the signature over the raw request body and comparing it to the signature header.";

export const WEBHOOKS_FORM_DESTINATION_HEADING = "Destination";

export const WEBHOOKS_FORM_EVENTS_HEADING = "Events";

export const WEBHOOKS_DESTINATION_URL_LABEL = "Destination URL";

export const WEBHOOKS_DESTINATION_URL_HELPER = "Must be an HTTPS endpoint reachable from ArchLucid.";

export const WEBHOOKS_SIGNING_SECRET_LABEL = "Signing secret";

export const WEBHOOKS_SIGNING_SECRET_HELPER =
  "Enter the signing secret once (minimum 16 characters). ArchLucid stores it securely and will not display it again.";

export const WEBHOOKS_MUTATION_PREREQUISITE_NOTICE =
  "Creating or changing subscriptions requires a role that can manage alert routing.";

export const WEBHOOKS_DELIVERY_CONTRACT_HEADING = "Delivery and signature verification";

export const WEBHOOKS_SIGNATURE_HEADER_NAME = "X-ArchLucid-Webhook-Signature";

export const WEBHOOKS_SIGNATURE_VALUE_PREFIX = "sha256=";

export const WEBHOOKS_SIGNATURE_ALGORITHM =
  "HMAC-SHA256 over the UTF-8 bytes of the JSON request body, encoded as lowercase hexadecimal.";

export const WEBHOOKS_SIGNATURE_VERIFICATION =
  "Recompute HMAC-SHA256 on the raw request body, encode the digest as lowercase hexadecimal, and compare it to the header value (with or without the sha256= prefix) using a constant-time comparison.";

/**
 * The signing key differs by delivery path today: the subscription secret signs test events only
 * (ArchLucid.Api WebhookSubscriptionTestService), while live alert deliveries fall back to the
 * platform shared secret (WebhookHmacEnvelopePoster). Stating this prevents endpoints from being
 * built against a key that passes the test event and then rejects production traffic.
 */
export const WEBHOOKS_SIGNATURE_KEY_SCOPE_NOTE =
  "Test events sent from the subscriptions list are signed with the signing secret you enter here. Live alert deliveries are signed with the platform shared secret your ArchLucid administrator configures — confirm that key with them before enforcing signature checks on production traffic.";

export const WEBHOOKS_CLOUD_EVENTS_ENVELOPE_NOTE =
  "Hosted environments wrap alert fields in a CloudEvents 1.0 JSON envelope before signing and POSTing. Verify the signature on the exact bytes your endpoint receives.";

/** Sample alert payload fields (camelCase JSON) from outbound OnCallWebhook delivery. */
export const WEBHOOKS_ALERT_PAYLOAD_SAMPLE_JSON = `{
  "severity": "High",
  "title": "Database connection pool exhausted",
  "category": "Availability",
  "triggerValue": "active connections > 95%",
  "description": "Scale read replicas or raise pool limits.",
  "alertId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "runId": "11111111-2222-3333-4444-555555555555"
}`;

export const WEBHOOKS_EVENTS_HELPER =
  "ArchLucid currently supports alert lifecycle events for outbound webhooks.";

export const WEBHOOKS_SEVERITY_LABEL = "Send alerts at or above";

export const WEBHOOKS_SEVERITY_HELPER = "Filters alert deliveries for this subscription only.";

export const WEBHOOKS_SAVE_LABEL = "Save subscription";

export const WEBHOOKS_SAVING_LABEL = "Saving subscription…";

export const WEBHOOKS_SAVE_SUCCESS = "Subscription saved.";

export const WEBHOOKS_TEST_LABEL = "Send test event";

export const WEBHOOKS_TESTING_LABEL = "Sending test event…";

export const WEBHOOKS_TEST_SUCCESS = "Test event delivered.";

export const WEBHOOKS_TEST_FAILURE = "We could not reach the destination.";

export const WEBHOOKS_SAVE_THEN_TEST_HELPER =
  "Save the subscription first, then send a test event from the subscriptions list.";

/** Heading for the saved-subscription list. */
export const WEBHOOKS_SUBSCRIPTIONS_HEADING = "Subscriptions";

export const WEBHOOKS_ACTIVE_HEADING = WEBHOOKS_SUBSCRIPTIONS_HEADING;

export const WEBHOOKS_EMPTY_TITLE = "No webhook subscriptions yet";

export const WEBHOOKS_EMPTY_BODY =
  "Create a subscription to send selected ArchLucid events to a secure endpoint that you manage.";

export const WEBHOOKS_NOT_CONFIGURED_NEXT_STEP =
  "Name the subscription, enter an HTTPS URL and signing secret, save, then send a test from Subscriptions.";

export const WEBHOOKS_BANNED_UI_PATTERNS = [
  /OnCallWebhook/i,
  /routingSubscriptionId/i,
  /metadataJson/i,
  /channelType/i,
  /synthetic ping/i,
  /dbo\./i,
] as const;

export function webhooksConfigurationStatusLabel(
  totalSubscriptionCount: number,
  enabledSubscriptionCount: number,
): string {
  if (totalSubscriptionCount === 0) {
    return "Not configured";
  }

  if (enabledSubscriptionCount === 0) {
    const noun = totalSubscriptionCount === 1 ? "subscription" : "subscriptions";

    return `${totalSubscriptionCount} ${noun}, none enabled`;
  }

  if (enabledSubscriptionCount === 1) {
    return "1 active subscription";
  }

  return `${enabledSubscriptionCount} active subscriptions`;
}

export function webhooksConfigurationStatusTagKind(
  totalSubscriptionCount: number,
  enabledSubscriptionCount: number,
): "ready" | "needs-attention" {
  if (totalSubscriptionCount === 0 || enabledSubscriptionCount === 0) {
    return "needs-attention";
  }

  return "ready";
}

/** Visible readiness copy when Save subscription is disabled for incomplete input (TB-2005). */
export function describeWebhooksSaveReadinessMessage(values: WebhookSettingsFormValues): string | null {
  const parsed = webhookSettingsFormSchema.safeParse(values);

  if (parsed.success) {
    return null;
  }

  const missingLabels: string[] = [];

  for (const issue of parsed.error.issues) {
    const pathKey = issue.path[0];

    if (pathKey === "name" && !missingLabels.includes("subscription name")) {
      missingLabels.push("subscription name");
    }

    if (pathKey === "webhookUrl" && !missingLabels.includes("HTTPS destination URL")) {
      missingLabels.push("HTTPS destination URL");
    }

    if (pathKey === "secret" && !missingLabels.includes("signing secret (16+ characters)")) {
      missingLabels.push("signing secret (16+ characters)");
    }

    if (pathKey === "eventTypes" && !missingLabels.includes("at least one event")) {
      missingLabels.push("at least one event");
    }
  }

  if (missingLabels.length === 0) {
    return "Complete the required fields to save this subscription.";
  }

  return `Enter ${missingLabels.join(", ")} to save this subscription.`;
}
