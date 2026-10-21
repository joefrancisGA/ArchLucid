import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (outboxId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(INTEGRATION_EVENTS_DLQ_ADVANCED_KEY_PARAM);
    } else {
      params.set(INTEGRATION_EVENTS_DLQ_ADVANCED_KEY_PARAM, trimmed);
    }
    },
  });
}
