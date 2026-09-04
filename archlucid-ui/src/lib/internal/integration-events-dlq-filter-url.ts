import { INTERNAL_INTEGRATION_EVENTS_DLQ_PATH } from "@/lib/internal-ops-route-paths";

export const INTEGRATION_EVENTS_DLQ_EVENT_TYPE_PARAM = "eventType";
export const INTEGRATION_EVENTS_DLQ_TENANT_PARAM = "tenant";

export function parseIntegrationEventsDlqEventTypeFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0 || trimmed === "all") {
    return "all";
  }

  return trimmed;
}

export function parseIntegrationEventsDlqTenantFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function integrationEventsDlqEventTypeHrefFromSearch(
  currentSearch: string,
  eventType: string,
  pathname: string = INTERNAL_INTEGRATION_EVENTS_DLQ_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = eventType.trim();

  if (trimmed.length === 0 || trimmed === "all") {
    params.delete(INTEGRATION_EVENTS_DLQ_EVENT_TYPE_PARAM);
  } else {
    params.set(INTEGRATION_EVENTS_DLQ_EVENT_TYPE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function integrationEventsDlqTenantHrefFromSearch(
  currentSearch: string,
  tenant: string,
  pathname: string = INTERNAL_INTEGRATION_EVENTS_DLQ_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = tenant.trim();

  if (trimmed.length === 0) {
    params.delete(INTEGRATION_EVENTS_DLQ_TENANT_PARAM);
  } else {
    params.set(INTEGRATION_EVENTS_DLQ_TENANT_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function integrationEventsDlqClearFiltersHrefFromSearch(
  currentSearch: string,
  pathname: string = INTERNAL_INTEGRATION_EVENTS_DLQ_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  params.delete(INTEGRATION_EVENTS_DLQ_EVENT_TYPE_PARAM);
  params.delete(INTEGRATION_EVENTS_DLQ_TENANT_PARAM);

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
