import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type BillingSubscriptionStatus = {
  hasSubscription: boolean;
  provider?: string | null;
  tierCode?: string | null;
  status?: string | null;
  isPaymentPastDue: boolean;
};

/** Fetches tenant subscription lifecycle status for operator billing UI. */
export async function fetchBillingSubscriptionStatus(): Promise<BillingSubscriptionStatus | null> {
  try {
    const res = await fetch(
      "/api/proxy/v1/tenant/billing/subscription",
      mergeRegistrationScopeForProxy({
        method: "GET",
        headers: { Accept: "application/json" },
      }),
    );

    if (!res.ok) {
      return null;
    }

    const json = (await res.json().catch(() => null)) as BillingSubscriptionStatus | null;

    if (json === null || typeof json !== "object") {
      return null;
    }

    return {
      hasSubscription: json.hasSubscription === true,
      provider: json.provider ?? null,
      tierCode: json.tierCode ?? null,
      status: json.status ?? null,
      isPaymentPastDue: json.isPaymentPastDue === true,
    };
  } catch {
    return null;
  }
}
