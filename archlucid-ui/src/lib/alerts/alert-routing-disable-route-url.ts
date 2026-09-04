import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";

export const ALERT_ROUTING_DISABLE_ROUTE_PARAM = "disableRouteId";

export function parseAlertRoutingDisableRouteIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function alertRoutingDisableRouteHrefFromSearch(
  currentSearch: string,
  routingSubscriptionId: string | null,
  pathname: string = GOVERNANCE_ALERT_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (routingSubscriptionId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(ALERT_ROUTING_DISABLE_ROUTE_PARAM);
  } else {
    params.set(ALERT_ROUTING_DISABLE_ROUTE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
