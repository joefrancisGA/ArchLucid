import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

export const ALERT_ROUTING_SUBSCRIPTION_LAST_VIEWED_STORAGE_KEY =
  "archlucid_alert_routing_subscription_continue_last_v1";

export type AlertRoutingContinueLastTarget = {
  readonly subscriptionId: string;
  readonly name: string;
};

function readStoredSubscriptionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored =
      window.localStorage.getItem(ALERT_ROUTING_SUBSCRIPTION_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeAlertRoutingSubscriptionLastViewedId(subscriptionId: string): void {
  const normalized = subscriptionId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ALERT_ROUTING_SUBSCRIPTION_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(subscription: AlertRoutingSubscription): AlertRoutingContinueLastTarget {
  return {
    subscriptionId: subscription.routingSubscriptionId,
    name: subscription.name.trim().length > 0 ? subscription.name : "Notification destination",
  };
}

function compareMostRecentDelivery(
  left: AlertRoutingSubscription,
  right: AlertRoutingSubscription,
): number {
  const leftDelivered = parseIsoUtcMs(left.lastDeliveredUtc ?? "");
  const rightDelivered = parseIsoUtcMs(right.lastDeliveredUtc ?? "");
  const leftWasDelivered = !Number.isNaN(leftDelivered);
  const rightWasDelivered = !Number.isNaN(rightDelivered);

  if (leftWasDelivered && rightWasDelivered) {
    return rightDelivered - leftDelivered;
  }

  if (leftWasDelivered) {
    return -1;
  }

  if (rightWasDelivered) {
    return 1;
  }

  const leftCreated = parseIsoUtcMs(left.createdUtc);
  const rightCreated = parseIsoUtcMs(right.createdUtc);
  const leftHasCreationTime = !Number.isNaN(leftCreated);
  const rightHasCreationTime = !Number.isNaN(rightCreated);

  if (leftHasCreationTime && rightHasCreationTime) {
    return rightCreated - leftCreated;
  }

  if (leftHasCreationTime) {
    return -1;
  }

  if (rightHasCreationTime) {
    return 1;
  }

  return 0;
}

/** Resolves the alert-routing subscription to pin as Continue last viewed. */
export function resolveContinueLastAlertRoutingSubscription(
  subscriptions: unknown,
): AlertRoutingContinueLastTarget | null {
  const normalizedSubscriptions = asNonemptyReadonlyArray<AlertRoutingSubscription>(subscriptions);

  if (normalizedSubscriptions === null) {
    return null;
  }

  const validSubscriptions = normalizedSubscriptions.filter(
    (subscription) =>
      typeof subscription?.routingSubscriptionId === "string"
      && typeof subscription?.name === "string"
      && typeof subscription?.createdUtc === "string"
      && (subscription?.lastDeliveredUtc == null || typeof subscription.lastDeliveredUtc === "string"),
  );

  if (validSubscriptions.length === 0) {
    return null;
  }

  const storedId = readStoredSubscriptionId();

  if (storedId !== null) {
    const storedMatch = validSubscriptions.find(
      (subscription) => subscription.routingSubscriptionId === storedId,
    );

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const mostRecent = validSubscriptions.slice().sort(compareMostRecentDelivery)[0];

  return mostRecent === undefined ? null : toTarget(mostRecent);
}
