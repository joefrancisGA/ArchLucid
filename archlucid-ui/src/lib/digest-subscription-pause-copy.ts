/** Copy for confirming pause of an architecture digest destination. */

export function resolveDigestSubscriptionPauseDialogTitle(subscriptionName: string): string {
  const trimmedName = subscriptionName.trim();
  const label = trimmedName.length > 0 ? trimmedName : "this destination";

  return `Pause digest delivery for ${label}?`;
}

export const DIGEST_SUBSCRIPTION_PAUSE_DIALOG_DESCRIPTION =
  "Scheduled architecture digests will stop going to this destination until you resume it. Destination settings and delivery history stay in this workspace.";
