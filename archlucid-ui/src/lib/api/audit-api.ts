import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { auditExportBlockedReason } from "@/lib/audit/audit-export-blocked-reason";
import {
  buildAuditExportCsvHonestyPreambleLines,
  type AuditExportCareerPosture,
} from "@/lib/audit/audit-export-career-posture";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import {
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob-trigger-browser";
import {
  apiGet,
  ensureOidcBearerReady,
  resolveBinaryGetRequest,
  withCorrelationHeaders,
} from "./http";
import {
  isRecord,
  positiveIntegerOrDefault,
  recordsOnly,
  trimRequiredText,
} from "./api-boundary-normalization";

export interface CursorPagedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  requestedTake: number;
}

/** Row from `GET /v1/audit` / `GET /v1/audit/search` items (camelCase JSON). */

export interface AuditEvent {
  eventId: string;
  occurredUtc: string;
  eventType: string;
  actorUserId: string;
  actorUserName: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  runId: string | null;
  manifestId: string | null;
  artifactId: string | null;
  dataJson: string;
  correlationId: string | null;
  otelTraceId?: string | null;
}

/** Filtered audit query for the operator UI (returns a cursor page). */
export async function searchAuditEvents(params: {
  /** Pass `nextCursor` from the prior page response. */
  cursor?: string;
  eventType?: string;
  fromUtc?: string;
  toUtc?: string;
  /** Explicit keyset — prefer `cursor` for load-more when supported. */
  beforeUtc?: string;
  /** Tie-break when many events share the same `occurredUtc` (matches API `beforeEventId`). */
  beforeEventId?: string;
  correlationId?: string;
  actorUserId?: string;
  runId?: string;
  take?: number;
}): Promise<CursorPagedResponse<AuditEvent>> {
  const query = new URLSearchParams();
  const setTrimmed = (key: string, value: string | undefined) => {
    const trimmed = value?.trim() ?? "";

    if (trimmed.length > 0) {
      query.set(key, trimmed);
    }
  };

  setTrimmed("cursor", params.cursor);
  setTrimmed("eventType", params.eventType);
  setTrimmed("fromUtc", params.fromUtc);
  setTrimmed("toUtc", params.toUtc);
  setTrimmed("beforeUtc", params.beforeUtc);
  setTrimmed("beforeEventId", params.beforeEventId);
  setTrimmed("correlationId", params.correlationId);
  setTrimmed("actorUserId", params.actorUserId);
  setTrimmed("runId", params.runId);

  if (params.take !== undefined) {
    query.set("take", String(positiveIntegerOrDefault(params.take, 100)));
  }
  const qs = query.toString();
  const raw = await apiGet<unknown>(`/v1/audit/search${qs ? `?${qs}` : ""}`);

  if (!isRecord(raw)) {
    throw new Error("Audit search response was not recognized.");
  }

  return {
    items: recordsOnly<AuditEvent>(raw.items),
    nextCursor: typeof raw.nextCursor === "string" ? raw.nextCursor.trim() : null,
    hasMore: raw.hasMore === true,
    requestedTake: positiveIntegerOrDefault(
      typeof raw.requestedTake === "number" ? raw.requestedTake : undefined,
      100,
    ),
  };
}

/** Core registry constants for event-type dropdowns (`GET /v1/audit/event-types`). */
export async function getAuditEventTypes(): Promise<string[]> {
  const raw = await apiGet<unknown>("/v1/audit/event-types");

  return Array.isArray(raw)
    ? raw
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
    : [];
}

/**
 * Downloads `GET /v1/audit/export` as CSV (browser only). Requires UTC instants acceptable to the API.
 * Optional filters match `GET /v1/audit/search`.
 */
export async function downloadAuditExportCsv(params: {
  fromUtcIso: string;
  toUtcIso: string;
  maxRows?: number;
  eventType?: string;
  correlationId?: string;
  actorUserId?: string;
  runId?: string;
  auditExportPosture?: AuditExportCareerPosture | null;
}): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadAuditExportCsv is only available in the browser.");
  }

  const query = new URLSearchParams();
  query.set("fromUtc", trimRequiredText(params.fromUtcIso, "fromUtcIso"));
  query.set("toUtc", trimRequiredText(params.toUtcIso, "toUtc"));
  const optionalFilters = {
    eventType: params.eventType,
    correlationId: params.correlationId,
    actorUserId: params.actorUserId,
    runId: params.runId,
  };

  for (const [key, value] of Object.entries(optionalFilters)) {
    const trimmed = value?.trim() ?? "";

    if (trimmed.length > 0) {
      query.set(key, trimmed);
    }
  }

  if (params.maxRows !== undefined) {
    query.set("maxRows", String(positiveIntegerOrDefault(params.maxRows, 10_000)));
  }

  await ensureOidcBearerReady();
  const { url, headers } = await resolveBinaryGetRequest(`/v1/audit/export?${query.toString()}`);
  const requestHeaders = withCorrelationHeaders(new Headers(headers));
  requestHeaders.set("Accept", "text/csv");
  const { headers: correlatedHeaders, correlationId } = applyCorrelationHeaders(requestHeaders);
  const response = await fetch(url, { cache: "no-store", headers: correlatedHeaders });
  const text = await response.text();

  if (!response.ok) {
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, text, correlationId));
    const blockedReason = auditExportBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  const posture = params.auditExportPosture ?? null;
  const blob = new Blob(
    [`${buildAuditExportCsvHonestyPreambleLines(posture).join("\n")}\n\n${text}`],
    { type: "text/csv;charset=utf-8" },
  );
  const filename =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ?? "audit-export.csv";

  await triggerBrowserBlobDownload(blob, filename);
}
