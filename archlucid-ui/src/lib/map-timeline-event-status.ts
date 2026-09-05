import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { isTimelineMilestoneEvent } from "@/lib/timeline-milestone-events";

/** Maps audit trail event type to enterprise StatusTag kind. */
export function mapTimelineEventToStatusKind(eventType: string): EnterpriseStatusKind {
  if (isTimelineMilestoneEvent(eventType)) {
    return "ready";
  }

  return "neutral";
}

/** Human label for audit trail event status chips. */
export function timelineEventStatusLabel(eventType: string): string {
  if (isTimelineMilestoneEvent(eventType)) {
    return "Milestone";
  }

  return "Step";
}
