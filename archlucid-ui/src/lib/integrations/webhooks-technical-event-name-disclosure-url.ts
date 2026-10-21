import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const WEBHOOKS_TECHNICAL_EVENT_NAME_EVENT_ID_PARAM = "webhooksTechnicalEventNameEventId";

export function parseWebhooksTechnicalEventNameEventIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function webhooksTechnicalEventNameDisclosureHrefFromSearch(
  currentSearch: string,
  eventId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (eventId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(WEBHOOKS_TECHNICAL_EVENT_NAME_EVENT_ID_PARAM);
    } else {
      params.set(WEBHOOKS_TECHNICAL_EVENT_NAME_EVENT_ID_PARAM, trimmed);
    }
    },
  });
}
