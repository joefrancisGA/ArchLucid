import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import type { ArchitectureTraceTimelineEntry } from "@/types/architecture-provenance";

const ARCHITECTURE_TIMELINE_KIND_LABELS: Record<string, string> = {
  runCreated: "Review run created",
  taskCreated: "Agent task scheduled",
  taskCompleted: "Agent task completed",
  resultRecorded: "Agent result recorded",
  traceEvent: "Trace event recorded",
  decisionNodeRecorded: "Decision node recorded",
  manifestCommitted: "Manifest committed",
  runCompleted: "Review run completed",
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
