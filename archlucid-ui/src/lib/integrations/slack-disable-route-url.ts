import { INTEGRATIONS_SLACK_PATH } from "@/lib/integrations-nav-paths";

export const SLACK_DISABLE_ID_PARAM = "slackDisableId";

export function parseSlackDisableIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function slackDisableRouteHrefFromSearch(
  currentSearch: string,
  routingSubscriptionId: string | null,
  pathname: string = INTEGRATIONS_SLACK_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const disableId = (routingSubscriptionId ?? "").trim();

  if (disableId.length === 0) {
    params.delete(SLACK_DISABLE_ID_PARAM);
  } else {
    params.set(SLACK_DISABLE_ID_PARAM, disableId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
