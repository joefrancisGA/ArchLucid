import type { FindingDispositionEvent } from "@/lib/api/governance-stickiness-api";

export function latestDispositionEvent(
  history: readonly FindingDispositionEvent[],
): FindingDispositionEvent | null {
  if (history.length === 0) {
    return null;
  }

  return history[0] ?? null;
}

export function formatDispositionConcurrentUpdateMessage(
  latestEvent: FindingDispositionEvent,
): string {
  return `Another operator recorded ${latestEvent.disposition} at ${latestEvent.occurredAtUtc}. That event is current on the disposition trail. Your save is still in history.`;
}

export function resolveDispositionConcurrentUpdateNotice(
  savedEvent: FindingDispositionEvent,
  refreshedHistory: readonly FindingDispositionEvent[],
): string | null {
  const latest = latestDispositionEvent(refreshedHistory);

  if (latest === null) {
    return null;
  }

  if (latest.eventId === savedEvent.eventId) {
    return null;
  }

  return formatDispositionConcurrentUpdateMessage(latest);
}
