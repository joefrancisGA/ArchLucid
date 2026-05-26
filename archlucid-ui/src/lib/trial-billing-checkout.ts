import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";

type BillingCheckoutResponse = {
  status?: string;
  checkoutUrl?: string | null;
};

/** Starts hosted billing checkout; redirects when a checkout URL is returned. */
export async function startTrialBillingCheckout(): Promise<boolean> {
  try {
    const res = await fetch(
      "/api/proxy/v1/tenant/billing/checkout",
      mergeRegistrationScopeForProxy({ method: "POST", headers: { Accept: "application/json" } }),
    );

    const json = (await res.json().catch(() => null)) as BillingCheckoutResponse | null;

    if (!res.ok) {
      showError("Billing", `Checkout request failed (${res.status}).`);

      return false;
    }

    if (json?.status === "not_configured") {
      showSuccess("Billing: checkout will open here once billing is connected for your tenant.");

      return false;
    }

    const checkoutUrl = json?.checkoutUrl?.trim() ?? "";

    if (checkoutUrl.length > 0) {
      window.location.assign(checkoutUrl);

      return true;
    }

    showSuccess("Billing: request accepted.");

    return true;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Request failed.";
    showError("Billing", message);

    return false;
  }
}
