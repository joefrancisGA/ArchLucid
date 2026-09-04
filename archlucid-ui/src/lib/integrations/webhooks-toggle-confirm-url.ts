import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";

export const WEBHOOK_DISABLE_ID_PARAM = "webhookDisableId";
export const WEBHOOK_ENABLE_ID_PARAM = "webhookEnableId";

export type WebhooksToggleConfirmUrlState = {
  readonly disableRoutingSubscriptionId: string | null;
  readonly enableRoutingSubscriptionId: string | null;
};

export function parseWebhookDisableIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseWebhookEnableIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function webhooksToggleConfirmHrefFromSearch(
  currentSearch: string,
  state: WebhooksToggleConfirmUrlState,
  pathname: string = INTEGRATIONS_WEBHOOKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const disableId = (state.disableRoutingSubscriptionId ?? "").trim();
  const enableId = (state.enableRoutingSubscriptionId ?? "").trim();

  if (disableId.length === 0) {
    params.delete(WEBHOOK_DISABLE_ID_PARAM);
  } else {
    params.set(WEBHOOK_DISABLE_ID_PARAM, disableId);
    params.delete(WEBHOOK_ENABLE_ID_PARAM);
  }

  if (enableId.length === 0) {
    params.delete(WEBHOOK_ENABLE_ID_PARAM);
  } else if (disableId.length === 0) {
    params.set(WEBHOOK_ENABLE_ID_PARAM, enableId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
