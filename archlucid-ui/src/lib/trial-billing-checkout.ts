import { startBillingCheckout } from "@/lib/billing-checkout-client";

/** Starts hosted billing checkout for trial conversion; defaults to the Team SKU. */
export async function startTrialBillingCheckout(): Promise<boolean> {
  const result = await startBillingCheckout({ targetTier: "Team" });

  return result.outcome === "redirected";
}
