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

function positiveIntegerOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
}

function recordArray<T>(value: unknown): T[] {
  return Array.isArray(value)
    ? value.filter((item): item is T => item !== null && typeof item === "object" && !Array.isArray(item))
    : [];
}

/** Lists alert records, optionally filtered by status (Active, Acknowledged, Resolved, Suppressed). */
export async function listAlerts(status: string | null, take = 100): Promise<AlertRecord[]> {
  const q = new URLSearchParams();
  const normalizedStatus = status?.trim() ?? "";

  if (normalizedStatus.length > 0) q.set("status", normalizedStatus);
  q.set("take", String(positiveIntegerOrDefault(take, 100)));
  const suffix = q.toString();
  const raw = await apiGet<unknown>(`/v1/alerts${suffix ? `?${suffix}` : ""}`);

  return recordArray<AlertRecord>(raw);
}

/** Paged alerts (GET with `page` + `pageSize` — returns PagedResponse). */
export async function listAlertsPaged(
  status: string | null,
  page: number,
  pageSize: number,
): Promise<PagedResponse<AlertRecord>> {
  const q = new URLSearchParams();
  const normalizedStatus = status?.trim() ?? "";

  if (normalizedStatus.length > 0) q.set("status", normalizedStatus);
  q.set("page", String(positiveIntegerOrDefault(page, 1)));
  q.set("pageSize", String(positiveIntegerOrDefault(pageSize, 100)));

  const raw = await apiGet<Partial<PagedResponse<AlertRecord>>>(`/v1/alerts?${q}`);

  return {
    items: recordArray<AlertRecord>(raw.items),
    page: positiveIntegerOrDefault(raw.page ?? 1, 1),
    pageSize: positiveIntegerOrDefault(raw.pageSize ?? pageSize, 100),
    totalCount: Number.isFinite(raw.totalCount) && (raw.totalCount ?? 0) >= 0 ? raw.totalCount ?? 0 : 0,
    hasMore: raw.hasMore === true,
  };
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
  const normalizedStatus = status?.trim() ?? "";

  if (normalizedStatus.length > 0) {
    q.set("status", normalizedStatus);
  }

  q.set("take", String(positiveIntegerOrDefault(take, 100)));
  q.set("cursor", cursor?.trim() ?? "");

  const raw = await apiGet<Partial<CursorPagedResponse<AlertRecord>>>(`/v1/alerts?${q}`);

  return {
    items: recordArray<AlertRecord>(raw.items),
    nextCursor: typeof raw.nextCursor === "string" ? raw.nextCursor.trim() : null,
    hasMore: raw.hasMore === true,
    requestedTake: positiveIntegerOrDefault(raw.requestedTake ?? take, 100),
  };
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
  const raw = await apiGet<Partial<AlertsInboxSummaryApiDto>>("/v1/alerts/inbox-summary");
  const count = (value: number | undefined): number =>
    Number.isFinite(value) && (value ?? 0) >= 0 ? value ?? 0 : 0;

  return {
    openCount: count(raw.openCount),
    acknowledgedCount: count(raw.acknowledgedCount),
    resolvedCount: count(raw.resolvedCount),
    blockingCount: count(raw.blockingCount),
    lastEvaluatedUtc: typeof raw.lastEvaluatedUtc === "string" ? raw.lastEvaluatedUtc.trim() : null,
  };
}

export async function applyAlertAction(
  alertId: string,
  action: "Acknowledge" | "Resolve" | "Suppress",
  comment?: string,
): Promise<AlertRecord> {
  const normalizedAlertId = alertId.trim();

  if (normalizedAlertId.length === 0) {
    throw new Error("alertId is required.");
  }

  return apiPostJson<AlertRecord>(`/${ApiV1Routes.alerts}/${encodeURIComponent(normalizedAlertId)}/action`, {
    action,
    comment: comment ?? "",
  });
}

/** Acknowledges multiple alerts in one request (POST /v1/alerts/acknowledge-batch). */
export async function acknowledgeAlertsBatch(
  alertIds: string[],
  comment?: string,
): Promise<AlertsAcknowledgeBatchResponse> {
  const normalizedAlertIds = alertIds.map((alertId) => alertId.trim()).filter((alertId) => alertId.length > 0);

  return apiPostJson<AlertsAcknowledgeBatchResponse>(`/${ApiV1Routes.alerts}/acknowledge-batch`, {
    alertIds: normalizedAlertIds,
    comment: comment ?? "",
  });
}

/** Archives an alert (PATCH /v1/alerts/{alertId}/archive). */
export async function archiveAlert(alertId: string): Promise<AlertRecord> {
  const normalizedAlertId = alertId.trim();

  if (normalizedAlertId.length === 0) {
    throw new Error("alertId is required.");
  }

  return apiPatchJson<AlertRecord>(`/${ApiV1Routes.alerts}/${encodeURIComponent(normalizedAlertId)}/archive`, {});
}

/** Workspace readiness for alerts inbox empty states. */
export async function fetchAlertsInboxWorkspaceContext(): Promise<{
  hasAlertRules: boolean;
  hasReviews: boolean;
}> {
  return apiGet(`/${ApiV1Routes.alerts}/inbox/workspace-context`);
}
