export const HELP_BILLING_FAQ_ID_PARAM = "helpBillingFaqId";

export function parseHelpBillingFaqIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpBillingFaqDisclosureHrefFromSearch(
  currentSearch: string,
  faqId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (faqId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HELP_BILLING_FAQ_ID_PARAM);
  } else {
    params.set(HELP_BILLING_FAQ_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
