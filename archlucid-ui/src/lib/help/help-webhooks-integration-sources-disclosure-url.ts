import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_WEBHOOKS_INTEGRATION_SOURCES_OPEN_PARAM = "helpWebhooksIntegrationSourcesOpen";

export function parseHelpWebhooksIntegrationSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpWebhooksIntegrationSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_WEBHOOKS_INTEGRATION_SOURCES_OPEN_PARAM);
}
