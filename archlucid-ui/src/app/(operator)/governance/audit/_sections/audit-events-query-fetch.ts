import type { CursorPagedResponse } from "@/lib/api";
import { searchAuditEvents } from "@/lib/api";
import type { AuditEvent } from "@/lib/api";

import type { AuditFilterFields } from "./audit-page-helpers";
import { AUDIT_PAGE_SIZE } from "./audit-page-helpers";

export function auditFiltersToQueryRecord(filters: AuditFilterFields): Record<string, string> {
  return {
    eventType: filters.eventType,
    fromUtc: filters.fromUtc,
    toUtc: filters.toUtc,
    correlationId: filters.correlationId.trim(),
    actorUserId: filters.actorUserId.trim(),
    runId: filters.runId.trim(),
  };
}

export async function fetchAuditEventsSearch(
  filters: AuditFilterFields,
  loadMoreCursor?: string | null,
): Promise<CursorPagedResponse<AuditEvent>> {
  const payload = {
    eventType: filters.eventType || undefined,
    fromUtc: filters.fromUtc ? new Date(filters.fromUtc).toISOString() : undefined,
    toUtc: filters.toUtc ? new Date(filters.toUtc).toISOString() : undefined,
    cursor: loadMoreCursor ?? undefined,
    correlationId: filters.correlationId.trim() || undefined,
    actorUserId: filters.actorUserId.trim() || undefined,
    runId: filters.runId.trim() || undefined,
    take: AUDIT_PAGE_SIZE,
  };

  return searchAuditEvents(payload);
}
