/** Pure helpers for the operator audit page (Vitest-friendly). */

import {
  auditEventLifecycleStage,
  ReviewAuditLifecycleStage,
  type ReviewAuditLifecycleStageValue,
} from "@/lib/audit-event-presentation";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/**
 * True when the buyer-polished audit row should treat the actor as system-recorded (aligned with card subtitles).
 */
export function auditBuyerEventIsSystemRecordedActor(actorUserName: string): boolean {
  const lower = actorUserName.trim().toLowerCase();

  if (lower.length === 0) {
    return false;
  }

  return (
    lower.includes("archlucid automation") ||
    lower.includes("archlucid system") ||
    lower.includes("automation") ||
    lower.includes("recorded by archlucid")
  );
}

export function formatAuditSummaryHeading(count: number, hasMore: boolean): string {
  if (count === 0) {
    return "Showing 0 events";
  }

  const suffix = hasMore ? "+" : "";

  return `Showing ${count}${suffix} event${count === 1 ? "" : "s"}`;
}

export function canExportAuditCsv(fromUtc: string, toUtc: string): boolean {
  return fromUtc.trim().length > 0 && toUtc.trim().length > 0;
}

/**
 * Mirrors **`ArchLucidPolicies.RequireAuditor`** on `AuditController.ExportAudit` — Auditor or Admin app role only.
 * Operator without Auditor still fails export at the API; keep the button soft-disabled for consistent UX.
 */
export function principalRolesAllowAuditCsvExport(roleClaimValues: ReadonlyArray<string>): boolean {
  for (const raw of roleClaimValues) {
    const normalized = raw.trim().toLowerCase();

    if (normalized.length === 0) {
      continue;
    }

    if (normalized === "auditor" || normalized === "admin") {
      return true;
    }
  }

  return false;
}

/**
 * Stable lifecycle ordering for audit / pipeline milestone cards (buyer timeline + demo samples).
 */
export function auditEventLifecycleSortKey(eventType: string): number {
  const table: Record<string, number> = {
    RunStarted: 0,
    "context.snapshot.created": 10,
    "graph.snapshot.created": 20,
    "findings.snapshot.created": 30,
    "finalize.run": 40,
    "com.archlucid.governance.approval.recorded": 45,
    "artifact.bundle.created": 50,
  };

  const key = eventType.trim();
  const rank = table[key];

  if (rank !== undefined) {
    return rank;
  }

  return 1000;
}

/** Ordered stage titles for the review pipeline (demo / buyer lifecycle grouping). */
export const AUDIT_EVENT_LIFECYCLE_STAGE_ORDER: ReadonlyArray<string> = [
  "Review started",
  "Source context captured",
  "Graph created",
  "Findings generated",
  "Manifest finalized",
  "Governance approval recorded",
  "Artifacts bundled",
];

function lifecycleStageHeading(stage: ReviewAuditLifecycleStageValue): string | null {
  switch (stage) {
    case ReviewAuditLifecycleStage.ReviewStarted:
      return "Review started";

    case ReviewAuditLifecycleStage.ContextCaptured:
      return "Source context captured";

    case ReviewAuditLifecycleStage.GraphCreated:
      return "Graph created";

    case ReviewAuditLifecycleStage.FindingsCaptured:
      return "Findings generated";

    case ReviewAuditLifecycleStage.ManifestFinalized:
      return "Manifest finalized";

    case ReviewAuditLifecycleStage.ArtifactsBundled:
      return "Artifacts bundled";

    case ReviewAuditLifecycleStage.GovernanceHandoff:
      return "Governance approval recorded";

    default:
      return null;
  }
}

/**
 * Maps an event type to a lifecycle stage heading for buyer grouping — dotted pipeline keys first (API literals),
 * then coarse buckets aligned with {@link ReviewAuditLifecycleStage}.
 */
export function auditEventLifecycleStageLabel(eventType: string): string | null {
  const t = eventType.trim();

  switch (t) {
    case "RunStarted":
    case "RunSubmitted":
      return "Review started";

    case "context.snapshot.created":
    case "context_snapshot":
      return "Source context captured";

    case "graph.snapshot.created":
    case "graph_snapshot":
      return "Graph created";

    case "findings.snapshot.created":
    case "findings_snapshot":
      return "Findings generated";

    case "finalize.run":
      return "Manifest finalized";

    case "GovernanceApprovalRequested":
      return "Governance approval recorded";

    case "com.archlucid.governance.approval.recorded":
      return "Governance approval recorded";

    case "artifact.bundle.created":
      return "Artifacts bundled";

    default:
      return lifecycleStageHeading(auditEventLifecycleStage(t));
  }
}

/** True when every event belongs to a known lifecycle stage (use before grouping). */
export function auditEventsAreLifecycleOnlyForGrouping(events: ReadonlyArray<{ eventType: string }>): boolean {
  if (events.length === 0) {
    return false;
  }

  return events.every((eventItem) => auditEventLifecycleStageLabel(eventItem.eventType) !== null);
}

/** Groups events by lifecycle stage in canonical pipeline order. */
export function groupAuditEventsByLifecycleStage<T extends { eventType: string }>(
  events: ReadonlyArray<T>,
): { stage: string; events: T[] }[] {
  const byStage = new Map<string, T[]>();

  for (const eventItem of events) {
    const stageLabel = auditEventLifecycleStageLabel(eventItem.eventType);

    if (stageLabel === null) {
      continue;
    }

    const bucket = byStage.get(stageLabel);

    if (bucket === undefined) {
      byStage.set(stageLabel, [eventItem]);
    } else {
      bucket.push(eventItem);
    }
  }

  const result: { stage: string; events: T[] }[] = [];

  for (const stage of AUDIT_EVENT_LIFECYCLE_STAGE_ORDER) {
    const row = byStage.get(stage);

    if (row !== undefined && row.length > 0) {
      result.push({ stage, events: row });
    }
  }

  return result;
}

/** Buyer-polished audit ribbon above the timeline — narrative only; counts appear in metric tiles. */
export function formatBuyerAuditTrailSummaryLine(
  events: ReadonlyArray<{ readonly actorUserName?: string | null; readonly runId?: string | null }>,
  uniformRunId: string | null,
  filterRunId: string,
): string | null {
  if (events.length === 0) {
    return null;
  }

  const runKey =
    uniformRunId ?? (filterRunId.trim().length > 0 ? filterRunId.trim() : SHOWCASE_STATIC_DEMO_RUN_ID);
  const reviewTitle = buyerFacingReviewLinkLabelFromRunId(runKey);

  return `This audit trail shows the lifecycle from review creation through governance approval and packaged deliverables for ${reviewTitle}, with named human actors and automatically recorded lifecycle events.`;
}

/** Metric tiles for buyer-polished audit header — same actor classification as {@link formatBuyerAuditTrailSummaryLine}. */
export function buyerAuditTrailMetricCounts(
  events: ReadonlyArray<{ readonly actorUserName?: string | null }>,
): { eventCount: number; humanActorCount: number; systemRecordedCount: number } | null {
  if (events.length === 0) {
    return null;
  }

  const distinctHumans = new Set<string>();
  let systemRows = 0;

  for (const ev of events) {
    const name = (ev.actorUserName ?? "").trim();

    if (name.length === 0) {
      continue;
    }

    if (auditBuyerEventIsSystemRecordedActor(name)) {
      systemRows++;
    } else {
      distinctHumans.add(name);
    }
  }

  return {
    eventCount: events.length,
    humanActorCount: distinctHumans.size,
    systemRecordedCount: systemRows,
  };
}
