import type { AlertRecord } from "@/types/alerts";

import { ApiV1Routes } from "@/lib/api-v1-routes";
import { apiGet, apiPatchJson, apiPostJson } from "./http";
import type { CursorPagedResponse } from "./audit-api";
import type { PagedResponse } from "@/types/pagination";

export type AlertsAcknowledgeBatchItemResult = {
  alertId: string;
  succeeded: boolean;
  message?: string | null;
};

export type AlertsAcknowledgeBatchResponse = {
  results: AlertsAcknowledgeBatchItemResult[];
};

/** Lists alert records, optionally filtered by status (Active, Acknowledged, Resolved, Suppressed). */
export async function listAlerts(status: string | null, take = 100): Promise<AlertRecord[]> {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  q.set("take", String(take));
  const suffix = q.toString();
  return apiGet<AlertRecord[]>(`/v1/alerts${suffix ? `?${suffix}` : ""}`);
}

/** Paged alerts (GET with `page` + `pageSize` — returns PagedResponse). */
export async function listAlertsPaged(
  status: string | null,
  page: number,
  pageSize: number,
): Promise<PagedResponse<AlertRecord>> {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  q.set("page", String(page));
  q.set("pageSize", String(pageSize));

  return apiGet<PagedResponse<AlertRecord>>(`/v1/alerts?${q}`);
}

/**
 * Keyset-paged alerts (GET with `cursor` + `take` — returns CursorPagedResponse).
 * Pass `cursor: ""` (or omit) for the first page; API selects keyset when the `cursor` query key is present.
 */
export async function listAlertsCursor(
  status: string | null,
  take: number,
  cursor?: string | null,
): Promise<CursorPagedResponse<AlertRecord>> {
  const q = new URLSearchParams();

  if (status) {
    q.set("status", status);
  }

  q.set("take", String(take));
  q.set("cursor", cursor ?? "");

  return apiGet<CursorPagedResponse<AlertRecord>>(`/v1/alerts?${q}`);
}

/** Wire shape for GET /v1/alerts/inbox-summary (TB-2023). */
export type AlertsInboxSummaryApiDto = {
  openCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
  blockingCount: number;
  lastEvaluatedUtc?: string | null;
};

/** Inbox summary card aggregates — one RTT instead of N× listAlertsPaged page-size-1. */
export async function getAlertsInboxSummary(): Promise<AlertsInboxSummaryApiDto> {
  return apiGet<AlertsInboxSummaryApiDto>("/v1/alerts/inbox-summary");
}

export async function applyAlertAction(
  alertId: string,
  action: "Acknowledge" | "Resolve" | "Suppress",
  comment?: string,
): Promise<AlertRecord> {
  return apiPostJson<AlertRecord>(`/${ApiV1Routes.alerts}/${encodeURIComponent(alertId)}/action`, {
    action,
    comment: comment ?? "",
  });
}

/** Acknowledges multiple alerts in one request (POST /v1/alerts/acknowledge-batch). */
export async function acknowledgeAlertsBatch(
  alertIds: string[],
  comment?: string,
): Promise<AlertsAcknowledgeBatchResponse> {
  return apiPostJson<AlertsAcknowledgeBatchResponse>(`/${ApiV1Routes.alerts}/acknowledge-batch`, {
    alertIds,
    comment: comment ?? "",
  });
}

/** Archives an alert (PATCH /v1/alerts/{alertId}/archive). */
export async function archiveAlert(alertId: string): Promise<AlertRecord> {
  return apiPatchJson<AlertRecord>(`/${ApiV1Routes.alerts}/${encodeURIComponent(alertId)}/archive`, {});
}

/** Workspace readiness for alerts inbox empty states. */
export async function fetchAlertsInboxWorkspaceContext(): Promise<{
  hasAlertRules: boolean;
  hasReviews: boolean;
}> {
  return apiGet(`/${ApiV1Routes.alerts}/inbox/workspace-context`);
}
