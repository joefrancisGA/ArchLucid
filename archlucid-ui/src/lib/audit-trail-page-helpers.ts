import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer/buyer-facing-review-title";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { SHOWCASE_BUYER_REVIEW_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

import { AUDIT_TRAIL_PAGE_TITLE } from "@/lib/audit-trail-page-copy";

export type BuyerAuditGovernanceSummary = {
  readonly totalEvents: number;
  readonly decisions: number;
  readonly evidenceChanges: number;
  readonly approvals: number;
  readonly exports: number;
  readonly lastActivityUtc: string | null;
};

const DECISION_EVENT_MARKERS = [
  "decision",
  "finding.approved",
  "finding_approved",
  "disposition",
  "governance.approval.recorded",
  "GovernanceApprovalRequested",
] as const;

const EVIDENCE_EVENT_MARKERS = [
  "context.snapshot",
  "graph.snapshot",
  "findings.snapshot",
  "evidence",
  "snapshot",
  "artifact.bundle",
] as const;

const APPROVAL_EVENT_MARKERS = [
  "governance.approval",
  "GovernanceApproval",
  "manifest.committed",
  "finalize.run",
  "manifest.finalized",
] as const;

const EXPORT_EVENT_MARKERS = ["export", "download", "bundle.created", "artifact.bundle"] as const;

function eventTypeMatchesMarkers(eventType: string, markers: readonly string[]): boolean {
  const normalized = eventType.trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  return markers.some((marker) => normalized.includes(marker.toLowerCase()));
}

function resolveEffectiveAuditRunId(runId: string): string {
  const trimmed = runId.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  return SHOWCASE_STATIC_DEMO_RUN_ID;
}

/** True when the run id should stay in technical metadata instead of the page title. */
export function isTechnicalAuditRunIdentifier(runId: string): boolean {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (isShowcaseStaticDemoRunId(trimmed)) {
    return false;
  }

  const label = buyerFacingReviewLinkLabelFromRunId(trimmed);

  if (label !== trimmed) {
    return false;
  }

  return true;
}

/** Human review label for audit scope chips and titles; null when only a technical id is known. */
export function buyerFacingAuditTrailScopeLabel(runId: string): string | null {
  const effectiveRunId = resolveEffectiveAuditRunId(runId);

  if (isShowcaseStaticDemoRunId(effectiveRunId)) {
    return SHOWCASE_BUYER_REVIEW_TITLE.replace(/ Review$/, "");
  }

  if (isTechnicalAuditRunIdentifier(effectiveRunId)) {
    return null;
  }

  const label = buyerFacingReviewLinkLabelFromRunId(effectiveRunId);

  return label
    .replace(/ Review Package$/i, "")
    .replace(/ Review$/, "")
    .trim();
}

export function formatAuditTrailPageTitle(runId: string): string {
  const scopeLabel = buyerFacingAuditTrailScopeLabel(runId);

  if (scopeLabel === null || scopeLabel.length === 0) {
    return AUDIT_TRAIL_PAGE_TITLE;
  }

  return `${AUDIT_TRAIL_PAGE_TITLE} for ${scopeLabel}`;
}

export function formatAuditTrailReviewFilterChipLabel(runId: string): string {
  const scopeLabel = buyerFacingAuditTrailScopeLabel(runId);

  if (scopeLabel === null || scopeLabel.length === 0) {
    return "Review selected";
  }

  return `Review: ${scopeLabel}`;
}

export function buyerAuditTrailGovernanceSummaryCounts(
  events: ReadonlyArray<{ readonly eventType: string; readonly occurredUtc: string }>,
): BuyerAuditGovernanceSummary {
  let decisions = 0;
  let evidenceChanges = 0;
  let approvals = 0;
  let exportsCount = 0;
  let lastActivityUtc: string | null = null;

  for (const eventItem of events) {
    const eventType = eventItem.eventType;

    if (eventTypeMatchesMarkers(eventType, DECISION_EVENT_MARKERS)) {
      decisions++;
    }

    if (eventTypeMatchesMarkers(eventType, EVIDENCE_EVENT_MARKERS)) {
      evidenceChanges++;
    }

    if (eventTypeMatchesMarkers(eventType, APPROVAL_EVENT_MARKERS)) {
      approvals++;
    }

    if (eventTypeMatchesMarkers(eventType, EXPORT_EVENT_MARKERS)) {
      exportsCount++;
    }

    const occurredUtc = eventItem.occurredUtc.trim();

    if (occurredUtc.length === 0) {
      continue;
    }

    if (lastActivityUtc === null || occurredUtc.localeCompare(lastActivityUtc) > 0) {
      lastActivityUtc = occurredUtc;
    }
  }

  return {
    totalEvents: events.length,
    decisions,
    evidenceChanges,
    approvals,
    exports: exportsCount,
    lastActivityUtc,
  };
}

export function formatBuyerAuditTrailLastActivity(lastActivityUtc: string | null): string {
  if (lastActivityUtc === null || lastActivityUtc.trim().length === 0) {
    return "—";
  }

  return formatIsoUtcForDisplay(lastActivityUtc);
}

export function formatBuyerAuditResultsStatusLine(count: number, hasMore: boolean, searching: boolean): string {
  if (searching) {
    return "Loading audit events…";
  }

  if (count === 0) {
    return "No audit events in this view";
  }

  const suffix = hasMore ? "+" : "";

  return `${count}${suffix} audit event${count === 1 ? "" : "s"} in this view`;
}

/** Governance-facing event label for populated buyer audit rows. */
export function auditTrailGovernanceEventLabel(eventType: string): string {
  const friendly = pipelineEventTypeFriendlyLabel(eventType);
  const normalized = eventType.trim().toLowerCase();

  if (normalized.includes("finding") && normalized.includes("approv")) {
    return "Finding approved";
  }

  if (normalized.includes("decision")) {
    return "Decision recorded";
  }

  if (normalized.includes("evidence") || normalized.includes("snapshot")) {
    return "Evidence attached";
  }

  if (normalized.includes("governance.approval.recorded")) {
    return "Governance approval completed";
  }

  if (normalized.includes("export") || normalized.includes("download")) {
    return "Export downloaded";
  }

  if (normalized.includes("finalize") || normalized.includes("run.completed")) {
    return "Review finalized";
  }

  return friendly;
}
