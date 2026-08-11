/**
 * TB-2200 — single-package “what changed since finalize” timeline.
 * Compare remains two-review only; this answers post-lock movement on one package.
 */

import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";

export const PACKAGE_CHANGE_KINDS = ["disposition", "export", "approval", "other"] as const;

export type PackageChangeKind = (typeof PACKAGE_CHANGE_KINDS)[number];

/** Minimal event shape shared by pipeline timeline rows and audit search hits. */
export type PackageChangeSourceEvent = {
  readonly eventId?: string | null;
  readonly eventType: string;
  readonly occurredUtc: string;
  readonly actorUserName?: string | null;
};

export type PackageChangeTimelineEntry = {
  readonly id: string;
  readonly kind: PackageChangeKind;
  readonly title: string;
  readonly whenUtc: string;
  readonly eventType: string;
  readonly actorUserName?: string | null;
};

export type BuildPackageChangesSinceFinalizeOptions = {
  /** Prefer manifest created / finalize wall clock when known. */
  readonly finalizeUtc?: string | null;
};

const FINALIZE_BOUNDARY_MARKERS = [
  "ManifestFinalized",
  "finalize.run",
  "run.finalized",
  "com.archlucid.manifest.finalized.v1",
] as const;

const DISPOSITION_MARKERS = [
  "disposition",
  "finding.approved",
  "finding_approved",
  "decision",
  "OperatorGovernanceDecision",
  "operator.governance.decision",
] as const;

const APPROVAL_MARKERS = [
  "GovernanceApproval",
  "governance.approval",
  "com.archlucid.governance.approval",
  "approval.recorded",
  "approval.submitted",
  "approval.requested",
] as const;

const EXPORT_MARKERS = [
  "export",
  "download",
  "ArtifactsGenerated",
  "artifact.bundle",
  "bundle.created",
] as const;

function normalizeEventType(eventType: string): string {
  return eventType.trim();
}

function eventTypeMatchesMarkers(eventType: string, markers: readonly string[]): boolean {
  const normalized = normalizeEventType(eventType).toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  return markers.some((marker) => normalized.includes(marker.toLowerCase()));
}

/** True when the event is the finalize / lock boundary itself (not a post-finalize change). */
export function isFinalizeBoundaryEvent(eventType: string): boolean {
  const key = normalizeEventType(eventType);

  if (key.length === 0) {
    return false;
  }

  return FINALIZE_BOUNDARY_MARKERS.some((marker) => key === marker || key.toLowerCase() === marker.toLowerCase());
}

function parseOccurredMs(occurredUtc: string): number | null {
  const trimmed = occurredUtc.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const ms = Date.parse(trimmed);

  if (!Number.isFinite(ms)) {
    return null;
  }

  return ms;
}

/**
 * Picks the finalize wall clock: explicit option wins, else latest finalize-boundary event time.
 */
export function resolvePackageFinalizeUtc(
  events: readonly PackageChangeSourceEvent[],
  explicitFinalizeUtc?: string | null,
): string | null {
  const explicit = explicitFinalizeUtc?.trim() ?? "";

  if (explicit.length > 0 && parseOccurredMs(explicit) !== null) {
    return explicit;
  }

  let latestMs: number | null = null;
  let latestUtc: string | null = null;

  for (const eventItem of events) {
    if (!isFinalizeBoundaryEvent(eventItem.eventType)) {
      continue;
    }

    const ms = parseOccurredMs(eventItem.occurredUtc);

    if (ms === null) {
      continue;
    }

    if (latestMs === null || ms >= latestMs) {
      latestMs = ms;
      latestUtc = eventItem.occurredUtc.trim();
    }
  }

  return latestUtc;
}

/** Keeps events strictly after finalize (same-instant finalize rows are excluded). */
export function filterEventsAfterFinalize(
  events: readonly PackageChangeSourceEvent[],
  finalizeUtc: string | null | undefined,
): PackageChangeSourceEvent[] {
  const finalizeMs = finalizeUtc == null ? null : parseOccurredMs(finalizeUtc);

  if (finalizeMs === null) {
    return [];
  }

  return events.filter((eventItem) => {
    if (isFinalizeBoundaryEvent(eventItem.eventType)) {
      return false;
    }

    const occurredMs = parseOccurredMs(eventItem.occurredUtc);

    if (occurredMs === null) {
      return false;
    }

    return occurredMs > finalizeMs;
  });
}

/** Classifies a durable event code into the TB-2200 change kind vocabulary. */
export function classifyPackageChangeKind(eventType: string): PackageChangeKind {
  const key = normalizeEventType(eventType);

  if (key.length === 0) {
    return "other";
  }

  // Approvals before dispositions so "governance.approval.recorded" is not mis-tagged as disposition via "decision".
  if (eventTypeMatchesMarkers(key, APPROVAL_MARKERS)) {
    return "approval";
  }

  if (eventTypeMatchesMarkers(key, EXPORT_MARKERS)) {
    return "export";
  }

  if (eventTypeMatchesMarkers(key, DISPOSITION_MARKERS)) {
    return "disposition";
  }

  return "other";
}

function compareOccurredAsc(left: PackageChangeSourceEvent, right: PackageChangeSourceEvent): number {
  const leftMs = parseOccurredMs(left.occurredUtc) ?? 0;
  const rightMs = parseOccurredMs(right.occurredUtc) ?? 0;

  if (leftMs !== rightMs) {
    return leftMs - rightMs;
  }

  return normalizeEventType(left.eventType).localeCompare(normalizeEventType(right.eventType));
}

function resolveEntryId(eventItem: PackageChangeSourceEvent, index: number): string {
  const eventId = eventItem.eventId?.trim() ?? "";

  if (eventId.length > 0) {
    return eventId;
  }

  return `pkg-change-${index}-${eventItem.occurredUtc.trim()}-${normalizeEventType(eventItem.eventType)}`;
}

/**
 * Builds an oldest-first timeline of post-finalize package changes from pipeline / audit events.
 */
export function buildPackageChangesSinceFinalize(
  events: readonly PackageChangeSourceEvent[],
  options?: BuildPackageChangesSinceFinalizeOptions,
): PackageChangeTimelineEntry[] {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  const finalizeUtc = resolvePackageFinalizeUtc(events, options?.finalizeUtc ?? null);
  const afterFinalize = filterEventsAfterFinalize(events, finalizeUtc);
  const ordered = [...afterFinalize].sort(compareOccurredAsc);

  return ordered.map((eventItem, index) => {
    const eventType = normalizeEventType(eventItem.eventType);
    const actor = eventItem.actorUserName?.trim() ?? "";

    return {
      id: resolveEntryId(eventItem, index),
      kind: classifyPackageChangeKind(eventType),
      title: pipelineEventTypeFriendlyLabel(eventType),
      whenUtc: eventItem.occurredUtc.trim(),
      eventType,
      actorUserName: actor.length > 0 ? actor : null,
    };
  });
}

export const PACKAGE_CHANGES_SINCE_FINALIZE_EMPTY_COPY =
  "No recorded changes since finalize yet.";

export const PACKAGE_CHANGES_SINCE_FINALIZE_TITLE = "What changed since finalize";

export const PACKAGE_CHANGES_SINCE_FINALIZE_INTRO =
  "Dispositions, exports, and approvals recorded after this package was locked.";

export function packageChangeKindLabel(kind: PackageChangeKind): string {
  switch (kind) {
    case "disposition":
      return "Disposition";
    case "export":
      return "Export";
    case "approval":
      return "Approval";
    case "other":
      return "Other";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
