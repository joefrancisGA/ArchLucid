import type { components } from "@/lib/api-types.generated";
import { truncateMiddle } from "@/lib/truncate-middle";

export type IntegrationEventOutboxDeadLetterRow = components["schemas"]["IntegrationEventOutboxDeadLetterRow"];

export function formatAgeUtc(deadLetteredUtc: string | undefined | null): string {
  if (deadLetteredUtc === undefined || deadLetteredUtc === null || deadLetteredUtc === "") {
    return " — ";
  }

  const deadLetteredMs = Date.parse(deadLetteredUtc);

  if (Number.isNaN(deadLetteredMs)) {
    return " — ";
  }

  const ageMs = Math.max(0, Date.now() - deadLetteredMs);
  const minutes = Math.floor(ageMs / 60_000);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 48) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d`;
}

export function truncateErrorMessage(message: string | undefined | null): string {
  if (message === undefined || message === null || message.trim() === "") {
    return " — ";
  }

  return truncateMiddle(message, 96);
}

export function resolveReviewHref(runId: string | undefined | null): string | null {
  if (runId === undefined || runId === null || runId.trim() === "") {
    return null;
  }

  return `/architecture/reviews/${encodeURIComponent(runId)}`;
}

export function rowMatchesFilters(
  row: IntegrationEventOutboxDeadLetterRow,
  eventTypeFilter: string,
  tenantFilter: string,
): boolean {
  if (eventTypeFilter !== "all" && row.eventType !== eventTypeFilter) {
    return false;
  }

  if (tenantFilter.trim() === "") {
    return true;
  }

  const tenantId = row.tenantId ?? "";

  return tenantId.toLowerCase().includes(tenantFilter.trim().toLowerCase());
}
