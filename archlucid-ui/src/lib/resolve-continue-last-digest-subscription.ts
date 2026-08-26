import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import type { DigestSubscription } from "@/types/digest-subscriptions";

export const DIGEST_SUBSCRIPTION_LAST_VIEWED_STORAGE_KEY = "archlucid_digest_subscription_continue_last_v1";

export type DigestSubscriptionsContinueLastTarget = {
  readonly subscriptionId: string;
  readonly name: string;
};

function readStoredSubscriptionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(DIGEST_SUBSCRIPTION_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeDigestSubscriptionLastViewedId(subscriptionId: string): void {
  const normalized = subscriptionId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DIGEST_SUBSCRIPTION_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(subscription: DigestSubscription): DigestSubscriptionsContinueLastTarget {
  return {
    subscriptionId: subscription.subscriptionId,
    name: subscription.name.trim().length > 0 ? subscription.name : "Digest subscription",
  };
}

function compareMostRecentDelivery(left: DigestSubscription, right: DigestSubscription): number {
  const leftDelivered = left.lastDeliveredUtc?.trim() ?? "";
  const rightDelivered = right.lastDeliveredUtc?.trim() ?? "";

  if (leftDelivered.length > 0 && rightDelivered.length > 0) {
    return rightDelivered.localeCompare(leftDelivered);
  }

  if (leftDelivered.length > 0) {
    return -1;
  }

  if (rightDelivered.length > 0) {
    return 1;
  }

  return right.createdUtc.localeCompare(left.createdUtc);
}

/** Resolves the digest subscription to pin as Continue last viewed. */
export function resolveContinueLastDigestSubscription(
  subscriptions: unknown,
): DigestSubscriptionsContinueLastTarget | null {
  const normalizedSubscriptions = asNonemptyReadonlyArray<DigestSubscription>(subscriptions);

  if (normalizedSubscriptions === null) {
    return null;
  }

  const storedId = readStoredSubscriptionId();

  if (storedId !== null) {
    const storedMatch = normalizedSubscriptions.find((subscription) => subscription.subscriptionId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const mostRecent = normalizedSubscriptions.slice().sort(compareMostRecentDelivery)[0];

  return mostRecent === undefined ? null : toTarget(mostRecent);
}
