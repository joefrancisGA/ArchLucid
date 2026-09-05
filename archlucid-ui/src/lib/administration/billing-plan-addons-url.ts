import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";

export const BILLING_PLAN_ADDONS_OPEN_PARAM = "billingPlanAddonsOpen";

export function parseBillingPlanAddonsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function billingPlanAddonsHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = SETTINGS_BILLING_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(BILLING_PLAN_ADDONS_OPEN_PARAM);
  } else {
    params.set(BILLING_PLAN_ADDONS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
