import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";

export const DIGEST_SUBSCRIPTION_CHANNELS = ["Email", "TeamsWebhook", "SlackWebhook"] as const;
export type DigestSubscriptionChannel = (typeof DIGEST_SUBSCRIPTION_CHANNELS)[number];

export const DIGEST_TYPE_OPTIONS = [
  { value: "architecture", label: "Architecture digest" },
] as const;

export type DigestSubscriptionStatusBadge = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailChannel(channelType: string): boolean {
  return channelType.trim().toLowerCase() === "email";
}

export function isWebhookChannel(channelType: string): boolean {
  const normalized: string = channelType.trim().toLowerCase();

  return (
    normalized === "teamswebhook" ||
    normalized === "slackwebhook" ||
    normalized.endsWith("webhook")
  );
}

export function channelDestinationHelper(channelType: string): string {
  if (isEmailChannel(channelType)) {
    return "Enter a recipient or group email address.";
  }

  if (isWebhookChannel(channelType)) {
    return "Enter an HTTPS endpoint for digest delivery.";
  }

  return "Enter the delivery destination for this channel.";
}

export function channelDisplayLabel(channelType: string): string {
  switch (channelType) {
    case "Email":
      return "Email";
    case "TeamsWebhook":
      return "Teams webhook";
    case "SlackWebhook":
      return "Slack webhook";
    default:
      return channelType;
  }
}

/** Returns null when the destination is valid for the channel; otherwise a short validation message. */
export function validateDigestSubscriptionDestination(
  channelType: string,
  destination: string,
): string | null {
  const trimmed: string = destination.trim();

  if (trimmed.length === 0) {
    return "Destination is required.";
  }

  if (isEmailChannel(channelType)) {
    if (!EMAIL_PATTERN.test(trimmed)) {
      return "Enter a valid email address.";
    }

    return null;
  }

  if (isWebhookChannel(channelType)) {
    try {
      const url = new URL(trimmed);

      if (url.protocol !== "https:") {
        return "Webhook destinations must use HTTPS.";
      }

      return null;
    } catch {
      return "Enter a valid HTTPS URL.";
    }
  }

  return null;
}

export function isDigestSubscriptionFormValid(input: {
  readonly name: string;
  readonly channelType: string;
  readonly destination: string;
}): boolean {
  if (input.name.trim().length === 0) {
    return false;
  }

  return validateDigestSubscriptionDestination(input.channelType, input.destination) === null;
}

export function resolveLatestDeliveryAttempt(
  attempts: readonly DigestDeliveryAttempt[] | undefined,
): DigestDeliveryAttempt | null {
  if (attempts === undefined || attempts.length === 0) {
    return null;
  }

  const sorted: DigestDeliveryAttempt[] = [...attempts].sort(
    (a, b) => new Date(b.attemptedUtc).getTime() - new Date(a.attemptedUtc).getTime(),
  );

  return sorted[0] ?? null;
}

export function resolveSubscriptionStatusBadge(
  subscription: DigestSubscription,
  attempts: readonly DigestDeliveryAttempt[] | undefined,
): DigestSubscriptionStatusBadge {
  if (!subscription.isEnabled) {
    return { kind: "neutral", label: "Paused" };
  }

  const latest: DigestDeliveryAttempt | null = resolveLatestDeliveryAttempt(attempts);

  if (latest === null) {
    if (!subscription.destination?.trim()) {
      return { kind: "blocked", label: "Not configured" };
    }

    return { kind: "draft", label: "Pending verification" };
  }

  if (/fail|error/i.test(latest.status)) {
    return { kind: "blocked", label: "Failed" };
  }

  if (/success|delivered|sent|ok/i.test(latest.status)) {
    return { kind: "ready", label: "Active" };
  }

  return { kind: "in-progress", label: "Pending verification" };
}

export function formatDeliveryResult(
  attempts: readonly DigestDeliveryAttempt[] | undefined,
): string {
  const latest: DigestDeliveryAttempt | null = resolveLatestDeliveryAttempt(attempts);

  if (latest === null) {
    return "—";
  }

  if (latest.errorMessage?.trim()) {
    return `${latest.status}: ${latest.errorMessage.trim()}`;
  }

  return latest.status;
}
