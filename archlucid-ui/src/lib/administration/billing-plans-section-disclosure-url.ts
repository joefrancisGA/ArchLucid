export const BILLING_PLANS_SECTION_OPEN_PARAM = "billingPlansSectionOpen";

export function parseBillingPlansSectionOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function billingPlansSectionDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(BILLING_PLANS_SECTION_OPEN_PARAM);
  } else {
    params.set(BILLING_PLANS_SECTION_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
