import type { AuditActiveFilterChip } from "@/components/AuditActiveFilterChips";
import { formatAuditTrailReviewFilterChipLabel } from "@/lib/audit-trail-page-helpers";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";

export type AuditFilterChipInput = {
  eventType: string;
  fromUtc: string;
  toUtc: string;
  correlationId: string;
  actorUserId: string;
  runId: string;
  auditDatePreset: null | "24h" | "7d";
};

export function buildAuditActiveFilterChips(input: AuditFilterChipInput): AuditActiveFilterChip[] {
  const chips: AuditActiveFilterChip[] = [];

  if (input.eventType.trim().length > 0) {
    chips.push({
      id: "eventType",
      label: `Event: ${pipelineEventTypeFriendlyLabel(input.eventType.trim())}`,
    });
  }

  if (input.auditDatePreset === "24h") {
    chips.push({ id: "datePreset", label: "Last 24 hours" });
  }

  if (input.auditDatePreset === "7d") {
    chips.push({ id: "datePreset", label: "Last 7 days" });
  }

  if (input.fromUtc.trim().length > 0) {
    chips.push({ id: "fromUtc", label: `From ${input.fromUtc.trim()}` });
  }

  if (input.toUtc.trim().length > 0) {
    chips.push({ id: "toUtc", label: `To ${input.toUtc.trim()}` });
  }

  if (input.correlationId.trim().length > 0) {
    chips.push({ id: "correlationId", label: "Correlation ID" });
  }

  if (input.actorUserId.trim().length > 0) {
    chips.push({ id: "actorUserId", label: `Actor: ${input.actorUserId.trim()}` });
  }

  if (input.runId.trim().length > 0) {
    chips.push({ id: "runId", label: formatAuditTrailReviewFilterChipLabel(input.runId) });
  }

  return chips;
}
