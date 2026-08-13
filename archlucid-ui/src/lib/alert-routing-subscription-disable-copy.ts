export type AlertRoutingSubscriptionDisableChannel = "webhook" | "slack";

export function resolveAlertRoutingSubscriptionDisableDialogTitle(
  channel: AlertRoutingSubscriptionDisableChannel,
  subscriptionName: string,
): string {
  const trimmedName = subscriptionName.trim();
  const label = trimmedName.length > 0 ? trimmedName : "this destination";

  if (channel === "slack") {
    return `Disable Slack destination ${label}?`;
  }

  return `Disable webhook subscription ${label}?`;
}

export function resolveAlertRoutingSubscriptionDisableDialogDescription(
  channel: AlertRoutingSubscriptionDisableChannel,
): string {
  if (channel === "slack") {
    return "Governance alerts will no longer post to this Slack channel until you enable the destination again. Saved webhook credentials and delivery history stay in this workspace.";
  }

  return "Outbound HTTPS deliveries for this subscription will stop until you enable it again. Signing secrets, event filters, and delivery history stay in this workspace.";
}
