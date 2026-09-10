export const WEBHOOKS_DELIVERY_CONTRACT_OPEN_PARAM = "webhooksDeliveryContractOpen";

export function parseWebhooksDeliveryContractOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function webhooksDeliveryContractDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(WEBHOOKS_DELIVERY_CONTRACT_OPEN_PARAM);
  } else {
    params.set(WEBHOOKS_DELIVERY_CONTRACT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
