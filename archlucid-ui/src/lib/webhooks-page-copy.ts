export const WEBHOOKS_PAGE_TITLE = "Webhooks";

export const WEBHOOKS_PAGE_DESCRIPTION =
  "Send selected ArchLucid events to a secure HTTPS endpoint that you manage.";

export const WEBHOOKS_ABOUT_WHEN_TO_USE =
  "Use a webhook when you operate your own HTTPS receiver and need selected ArchLucid alert events delivered there.";

export const WEBHOOKS_ABOUT_WHAT_WE_SEND =
  "ArchLucid currently delivers alert lifecycle events you select below. Each delivery uses a JSON payload over HTTPS.";

export const WEBHOOKS_ABOUT_SECURITY =
  "Deliveries are signed with the signing secret you provide. ArchLucid stores the secret securely and never shows it again in this workspace.";

export const WEBHOOKS_ABOUT_DEVELOPERS =
  "Developers can verify the signature on incoming requests using the shared secret configured for the subscription.";

export const WEBHOOKS_FORM_DESTINATION_HEADING = "Destination";

export const WEBHOOKS_FORM_EVENTS_HEADING = "Events";

export const WEBHOOKS_DESTINATION_URL_LABEL = "Destination URL";

export const WEBHOOKS_DESTINATION_URL_HELPER = "Must be an HTTPS endpoint reachable from ArchLucid.";

export const WEBHOOKS_SIGNING_SECRET_LABEL = "Signing secret";

export const WEBHOOKS_SIGNING_SECRET_HELPER =
  "Enter the signing secret once. ArchLucid stores it securely and will not display it again.";

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
  "Save the subscription first, then send a test event from the active subscriptions list.";

export const WEBHOOKS_ACTIVE_HEADING = "Active subscriptions";

export const WEBHOOKS_EMPTY_TITLE = "No webhook subscriptions yet";

export const WEBHOOKS_EMPTY_BODY =
  "Create a subscription to send selected ArchLucid events to a secure endpoint that you manage.";

export const WEBHOOKS_NOT_CONFIGURED_NEXT_STEP =
  "Name the subscription, enter an HTTPS URL and signing secret, save, then send a test from Active subscriptions.";

export const WEBHOOKS_BANNED_UI_PATTERNS = [
  /OnCallWebhook/i,
  /routingSubscriptionId/i,
  /metadataJson/i,
  /channelType/i,
  /synthetic ping/i,
  /dbo\./i,
] as const;

export function webhooksConfigurationStatusLabel(activeSubscriptionCount: number): string {
  if (activeSubscriptionCount === 0) {
    return "Not configured";
  }

  if (activeSubscriptionCount === 1) {
    return "1 active subscription";
  }

  return `${activeSubscriptionCount} active subscriptions`;
}

export function webhooksConfigurationStatusTagKind(
  activeSubscriptionCount: number,
): "ready" | "needs-attention" {
  if (activeSubscriptionCount > 0) {
    return "ready";
  }

  return "needs-attention";
}
