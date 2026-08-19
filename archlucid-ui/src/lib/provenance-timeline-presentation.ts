import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import {
  ARCHITECTURE_REVIEW_LABEL,
  SIGNED_MANIFEST_LABEL,
} from "@/lib/usability/canonical-product-terms";
import type { ArchitectureTraceTimelineEntry } from "@/types/architecture-provenance";

const ARCHITECTURE_TIMELINE_KIND_LABELS: Record<string, string> = {
  runCreated: `${ARCHITECTURE_REVIEW_LABEL} opened`,
  taskCreated: "Evidence trail step scheduled",
  taskCompleted: "Evidence trail step completed",
  resultRecorded: "Evidence trail step recorded",
  traceEvent: "Evidence trail event recorded",
  decisionNodeRecorded: "Decision recorded",
  manifestCommitted: `${SIGNED_MANIFEST_LABEL} committed`,
  runCompleted: `${ARCHITECTURE_REVIEW_LABEL} completed`,
};

/** Primary human-readable label for a provenance timeline row. */
export function provenanceTimelinePrimaryLabel(row: ArchitectureTraceTimelineEntry): string {
  const trimmedLabel = row.label.trim();

  if (trimmedLabel.length > 0 && trimmedLabel !== row.kind) {
    return trimmedLabel;
  }

  const mapped = ARCHITECTURE_TIMELINE_KIND_LABELS[row.kind];

  if (mapped !== undefined) {
    return mapped;
  }

  return pipelineEventTypeFriendlyLabel(row.kind);
}

/** Secondary technical metadata shown beneath the primary label or in a tooltip. */
export function provenanceTimelineTechnicalKind(row: ArchitectureTraceTimelineEntry): string {
  return row.kind.trim();
}

/** Whether the timeline row exposes a non-empty technical kind for disclosure. */
export function provenanceTimelineShowsTechnicalKind(row: ArchitectureTraceTimelineEntry): boolean {
  return provenanceTimelineTechnicalKind(row).length > 0;
}
