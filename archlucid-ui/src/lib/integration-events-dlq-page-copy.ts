import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const INTEGRATION_EVENTS_DLQ_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.failedIntegrationMessages;

export const INTEGRATION_EVENTS_DLQ_PAGE_SUBTITLE =
  "Inspect outbound integration events that exceeded publish retries. Rows are dead-lettered until you retry after fixing the root cause.";

export const INTEGRATION_EVENTS_DLQ_BULK_RETRY_ACKNOWLEDGMENT = "all tenants" as const;

export const INTEGRATION_EVENTS_DLQ_EMPTY_TITLE = "No failed integration messages";

export const INTEGRATION_EVENTS_DLQ_EMPTY_DESCRIPTION =
  "When outbound integration events exceed retry limits, they appear here for Internal Operations triage.";

export function integrationEventsDlqListBlockedMessage(httpStatus: number): string {
  if (httpStatus === 401 || httpStatus === 403) {
    return "Administrator session required to inspect failed integration messages.";
  }

  return "Failed integration message list is temporarily unavailable. Refresh the page or open System health.";
}

export function integrationEventsDlqRetryFailedMessage(): string {
  return "Retry could not be queued. Confirm the root cause is fixed, then try again.";
}

export function integrationEventsDlqSuppressFailedMessage(): string {
  return "Suppress could not complete. Refresh the list and try again.";
}

export function integrationEventsDlqBulkRetryFailedMessage(): string {
  return "Bulk retry could not be queued. Fix the root cause before retrying across tenants.";
}

export function integrationEventsDlqCopyCurlFailedMessage(): string {
  return "Copy as cURL could not load. Open Troubleshooting or try again.";
}
