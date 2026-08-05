import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError } from "@/lib/toast";

type BillingPortalResponse = {
  portalUrl?: string | null;
  providerSessionId?: string | null;
};

export type StartBillingPortalResult = "redirected" | "failed";

function resolveBillingSettingsReturnUrl(): string {
  if (typeof window === "undefined") {
    return "/administration/billing";
  }

  return `${window.location.origin}/settings/billing`;
}

/** Starts Stripe Billing Portal for the signed-in tenant Admin; redirects when a portal URL is returned. */
export async function startBillingPortal(): Promise<StartBillingPortalResult> {
  try {
    const res = await fetch(
      "/api/proxy/v1/tenant/billing/portal",
      mergeRegistrationScopeForProxy({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: resolveBillingSettingsReturnUrl(),
        }),
      }),
    );

    const json = (await res.json().catch(() => null)) as BillingPortalResponse | null;

    if (!res.ok) {
      const detail =
        typeof json === "object" && json !== null && "title" in json ? String((json as { title?: string }).title ?? "") : "";
      const message = detail.length > 0 ? detail : `Billing portal request failed (${res.status}).`;
      showError("Billing", message);

      return "failed";
    }

    const portalUrl = json?.portalUrl?.trim() ?? "";

    if (portalUrl.length > 0) {
      window.location.assign(portalUrl);

      return "redirected";
    }

    showError("Billing", "Billing portal URL was missing from the response.");

    return "failed";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed.";
    showError("Billing", message);

    return "failed";
  }
}
