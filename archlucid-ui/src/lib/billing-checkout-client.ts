import {
  BILLING_CHECKOUT_NOT_CONFIGURED_MESSAGE,
  BILLING_CHECKOUT_REQUEST_ACCEPTED_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import {
  resolveBillingCheckoutTargetTier,
  type BillingCheckoutTargetTier,
} from "@/lib/billing-checkout-tier-map";
import type { MarketingPricingTierId } from "@/lib/marketing/marketing-public-pricing";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type BillingCheckoutResponse = {
  status?: string;
  checkoutUrl?: string | null;
  providerSessionId?: string | null;
};

export type StartBillingCheckoutRequest = {
  readonly targetTier: BillingCheckoutTargetTier;
  readonly seats?: number;
  readonly workspaces?: number;
  readonly billingEmail?: string;
  readonly returnUrl?: string;
  readonly cancelUrl?: string;
};

export type StartBillingCheckoutResult =
  | { readonly outcome: "redirected" }
  | { readonly outcome: "not_configured"; readonly message: string }
  | { readonly outcome: "accepted"; readonly message: string }
  | { readonly outcome: "failed"; readonly message: string };

function resolveBillingSettingsUrl(): string {
  if (typeof window === "undefined") {
    return "/administration/billing";
  }

  return `${window.location.origin}/settings/billing`;
}

function buildDefaultReturnUrls(): { returnUrl: string; cancelUrl: string } {
  const base = resolveBillingSettingsUrl();

  return {
    returnUrl: `${base}?checkout=success`,
    cancelUrl: `${base}?checkout=canceled`,
  };
}

/** Starts hosted billing checkout for the signed-in tenant Admin; redirects when Stripe returns a session URL. */
export async function startBillingCheckout(request: StartBillingCheckoutRequest): Promise<StartBillingCheckoutResult> {
  const defaults = buildDefaultReturnUrls();

  try {
    const res = await fetch(
      "/api/proxy/v1/tenant/billing/checkout",
      mergeRegistrationScopeForProxy({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTier: request.targetTier,
          seats: request.seats ?? 1,
          workspaces: request.workspaces ?? 1,
          billingEmail: request.billingEmail,
          returnUrl: request.returnUrl ?? defaults.returnUrl,
          cancelUrl: request.cancelUrl ?? defaults.cancelUrl,
        }),
      }),
    );

    const json = (await res.json().catch(() => null)) as BillingCheckoutResponse | null;

    if (!res.ok) {
      const detail = typeof json === "object" && json !== null && "title" in json ? String((json as { title?: string }).title ?? "") : "";
      const message = detail.length > 0 ? detail : `Checkout request failed (${res.status}).`;

      return { outcome: "failed", message };
    }

    if (json?.status === "not_configured") {
      return { outcome: "not_configured", message: BILLING_CHECKOUT_NOT_CONFIGURED_MESSAGE };
    }

    const checkoutUrl = json?.checkoutUrl?.trim() ?? "";

    if (checkoutUrl.length > 0) {
      window.location.assign(checkoutUrl);

      return { outcome: "redirected" };
    }

    return { outcome: "accepted", message: BILLING_CHECKOUT_REQUEST_ACCEPTED_MESSAGE };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed.";

    return { outcome: "failed", message };
  }
}

export type StartMarketingPlanBillingCheckoutRequest = {
  readonly planId: MarketingPricingTierId;
  readonly seats?: number;
  readonly workspaces?: number;
};

/** Convenience wrapper for operator billing plan cards. */
export async function startMarketingPlanBillingCheckout(
  request: StartMarketingPlanBillingCheckoutRequest,
): Promise<StartBillingCheckoutResult> {
  return startBillingCheckout({
    targetTier: resolveBillingCheckoutTargetTier(request.planId),
    seats: request.seats,
    workspaces: request.workspaces,
  });
}
