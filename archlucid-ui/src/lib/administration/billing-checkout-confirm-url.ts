import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";

export const BILLING_CHECKOUT_CONFIRM_PARAM = "checkoutConfirm";

export function parseBillingCheckoutConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function billingCheckoutConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string = SETTINGS_BILLING_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(BILLING_CHECKOUT_CONFIRM_PARAM);
  } else {
    params.set(BILLING_CHECKOUT_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
