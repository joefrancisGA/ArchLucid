import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

export const WEBHOOK_SUBSCRIPTION_LAST_VIEWED_STORAGE_KEY =
  "archlucid_webhook_subscription_continue_last_v1";

export type WebhooksContinueLastTarget = {
  readonly subscriptionId: string;
  readonly name: string;
};

function readStoredSubscriptionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(WEBHOOK_SUBSCRIPTION_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeWebhookSubscriptionLastViewedId(subscriptionId: string): void {
  const normalized = subscriptionId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(WEBHOOK_SUBSCRIPTION_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(subscription: AlertRoutingSubscription): WebhooksContinueLastTarget {
  return {
    subscriptionId: subscription.routingSubscriptionId,
    name: subscription.name.trim().length > 0 ? subscription.name : "Webhook subscription",
  };
}

/** Resolves the webhook subscription to pin as Continue last viewed. */
export function resolveContinueLastWebhookSubscription(
  subscriptions: unknown,
): WebhooksContinueLastTarget | null {
  const normalizedSubscriptions = asNonemptyReadonlyArray<AlertRoutingSubscription>(subscriptions);

  if (normalizedSubscriptions === null) {
    return null;
  }

  const storedId = readStoredSubscriptionId();

  if (storedId !== null) {
    const storedMatch = normalizedSubscriptions.find(
      (subscription) => subscription.routingSubscriptionId === storedId,
    );

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const enabled = normalizedSubscriptions.filter((subscription) => subscription.isEnabled === true);
  const pool = enabled.length > 0 ? enabled : normalizedSubscriptions;
  const newest = pool.slice().sort((left, right) => right.createdUtc.localeCompare(left.createdUtc))[0];

  return newest === undefined ? null : toTarget(newest);
}
