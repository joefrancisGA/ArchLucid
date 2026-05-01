/**
 * Team-tier Stripe checkout in `pricing.json`: hide buyer-facing Subscribe until a real checkout URL ships.
 */

/**
 * Returns true when `teamStripeCheckoutUrl` should surface the Subscribe-with-Stripe control (sales-led posture:
 * placeholders and empty URLs stay hidden).
 */
export function isUsableTeamStripeCheckoutUrl(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const url = raw.trim();

  if (url.length === 0) {
    return false;
  }

  const lower = url.toLowerCase();

  if (lower.includes("placeholder-replace-before-launch")) {
    return false;
  }

  if (lower.includes("checkout-placeholder")) {
    return false;
  }

  return true;
}
