import { INTERNAL_INTEGRATION_EVENTS_DLQ_PATH } from "@/lib/internal-ops-route-paths";

export const INTEGRATION_EVENTS_DLQ_BULK_RETRY_CONFIRM_PARAM = "dlqBulkRetryConfirm";
export const INTEGRATION_EVENTS_DLQ_SUPPRESS_ID_PARAM = "dlqSuppressId";

export function parseIntegrationEventsDlqBulkRetryConfirmOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseIntegrationEventsDlqSuppressIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export type IntegrationEventsDlqConfirmUrlState = {
  readonly bulkRetryConfirmOpen: boolean;
  readonly suppressOutboxId: string | null;
};

export function integrationEventsDlqConfirmHrefFromSearch(
  currentSearch: string,
  state: IntegrationEventsDlqConfirmUrlState,
  pathname: string = INTERNAL_INTEGRATION_EVENTS_DLQ_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const suppressId = (state.suppressOutboxId ?? "").trim();

  if (!state.bulkRetryConfirmOpen) {
    params.delete(INTEGRATION_EVENTS_DLQ_BULK_RETRY_CONFIRM_PARAM);
  } else {
    params.set(INTEGRATION_EVENTS_DLQ_BULK_RETRY_CONFIRM_PARAM, "1");
  }

  if (suppressId.length === 0) {
    params.delete(INTEGRATION_EVENTS_DLQ_SUPPRESS_ID_PARAM);
  } else {
    params.set(INTEGRATION_EVENTS_DLQ_SUPPRESS_ID_PARAM, suppressId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
