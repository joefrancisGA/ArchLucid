import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import { latestAlertRoutingConfigChange } from "@/lib/alert-routing-config-change";

export const ALERT_ROUTING_DESTINATION_NAME_PLACEHOLDER = "Primary notification destination";

export type AlertRoutingDeliveryStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export type AlertRoutingDeliveryHealthSummary = AlertRoutingDeliveryStatus;

/** Row delivery state — replaces bare Enabled/Disabled in the destination table. */
export function alertRoutingRowDeliveryStatus(
  item: AlertRoutingSubscription,
): AlertRoutingDeliveryStatus {
  if (!item.isEnabled) {
    return { kind: "neutral", label: "Disabled" };
  }

  const lastDelivered = item.lastDeliveredUtc?.trim() ?? "";

  if (lastDelivered.length > 0) {
    return { kind: "ready", label: "Delivering" };
  }

  return { kind: "needs-attention", label: "Awaiting delivery" };
}

/** Aggregate delivery health when at least one destination exists. */
export function summarizeAlertRoutingDeliveryHealth(
  items: readonly AlertRoutingSubscription[],
): AlertRoutingDeliveryHealthSummary | null {
  if (items.length === 0) {
    return null;
  }

  const enabledItems = items.filter((item) => item.isEnabled);

  if (enabledItems.length === 0) {
    return { kind: "neutral", label: "All destinations disabled" };
  }

  const deliveredCount = enabledItems.filter((item) => {
    const lastDelivered = item.lastDeliveredUtc?.trim() ?? "";

    return lastDelivered.length > 0;
  }).length;

  if (deliveredCount === enabledItems.length) {
    return {
      kind: "ready",
      label: `${deliveredCount} of ${enabledItems.length} delivering`,
    };
  }

  if (deliveredCount === 0) {
    return { kind: "needs-attention", label: "No successful deliveries yet" };
  }

  return {
    kind: "needs-attention",
    label: `${deliveredCount} of ${enabledItems.length} enabled destinations delivered`,
  };
}

/** Latest configuration timestamp across destinations. */
export function latestAlertRoutingConfigRecordedUtc(
  items: readonly AlertRoutingSubscription[],
): string | null {
  return latestAlertRoutingConfigChange(items)?.recordedUtc ?? null;
}

export function formatAlertRoutingConfigProvenanceLine(
  recordedUtc: string | null,
  actor: string | null = null,
): string | null {
  if (recordedUtc === null) {
    return null;
  }

  const formatted = formatInstantForLocale(recordedUtc);

  if (formatted === "—") {
    return null;
  }

  const trimmedActor = actor?.trim() ?? "";

  if (trimmedActor.length > 0) {
    return `Configuration last changed by ${trimmedActor} on ${formatted}`;
  }

  return `Configuration last recorded ${formatted}`;
}
