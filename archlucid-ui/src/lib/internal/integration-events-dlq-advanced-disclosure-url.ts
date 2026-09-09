export const INTEGRATION_EVENTS_DLQ_ADVANCED_KEY_PARAM = "integrationEventsDlqAdvancedKey";

export function parseIntegrationEventsDlqAdvancedKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function integrationEventsDlqAdvancedDisclosureHrefFromSearch(
  currentSearch: string,
  outboxId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (outboxId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(INTEGRATION_EVENTS_DLQ_ADVANCED_KEY_PARAM);
  } else {
    params.set(INTEGRATION_EVENTS_DLQ_ADVANCED_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
