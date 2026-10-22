import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, WEBHOOKS_DELIVERY_CONTRACT_OPEN_PARAM);
}
