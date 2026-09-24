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

  const validSubscriptions = normalizedSubscriptions.filter(
    (subscription) =>
      typeof subscription?.routingSubscriptionId === "string"
      && typeof subscription?.name === "string"
      && typeof subscription?.createdUtc === "string",
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

    // Stale or out-of-workspace ids must not fall back to another subscription while
    // the UI still labels the row "Continue last viewed".
    return null;
  }

  const enabled = validSubscriptions.filter((subscription) => subscription.isEnabled === true);
  const pool = enabled.length > 0 ? enabled : validSubscriptions;
  const newest = pool
    .map((subscription) => ({
      subscription,
      createdAt: Date.parse(subscription.createdUtc),
    }))
    .filter((entry) => !Number.isNaN(entry.createdAt))
    .reduce<typeof pool[number] | null>(
      (latest, entry) =>
        latest === null || entry.createdAt > Date.parse(latest.createdUtc)
          ? entry.subscription
          : latest,
      null,
    );

  return newest === null ? null : toTarget(newest);
}
