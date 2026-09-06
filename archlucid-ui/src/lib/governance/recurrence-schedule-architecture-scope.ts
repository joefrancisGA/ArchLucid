import type { ArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";

/** Normalizes GUID strings for stable recurrence schedule comparisons. */
export function normalizeRecurrenceScopeGuid(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const hex = trimmed.replace(/-/g, "");

  if (hex.length !== 32 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase();
}

export function resolveRecurrenceArchitectureIdForReview(input: {
  readonly architectureId?: string | null;
  readonly schedules: readonly ArchitectureReviewRecurrenceSchedule[];
  readonly sourceRunId: string;
}): string | null {
  const explicitArchitectureId = normalizeRecurrenceScopeGuid(input.architectureId);

  if (explicitArchitectureId !== null) {
    return explicitArchitectureId;
  }

  const normalizedSourceRunId = normalizeRecurrenceScopeGuid(input.sourceRunId);

  if (normalizedSourceRunId === null) {
    return null;
  }

  for (const schedule of input.schedules) {
    const scheduleArchitectureId = normalizeRecurrenceScopeGuid(schedule.architectureId ?? null);

    if (scheduleArchitectureId === null) {
      continue;
    }

    const scheduleSourceRunId = normalizeRecurrenceScopeGuid(schedule.sourceRunId);

    if (scheduleSourceRunId === normalizedSourceRunId) {
      return scheduleArchitectureId;
    }
  }

  return null;
}

/** Prefer architecture identity scope; fall back to source review id when identity is unknown. */
export function filterRecurrenceSchedulesForReviewScope(input: {
  readonly schedules: readonly ArchitectureReviewRecurrenceSchedule[];
  readonly sourceRunId: string;
  readonly architectureId?: string | null;
}): ArchitectureReviewRecurrenceSchedule[] {
  const architectureId = resolveRecurrenceArchitectureIdForReview(input);

  if (architectureId !== null) {
    return input.schedules.filter(
      (schedule) => normalizeRecurrenceScopeGuid(schedule.architectureId ?? null) === architectureId,
    );
  }

  const normalizedSourceRunId = normalizeRecurrenceScopeGuid(input.sourceRunId);

  if (normalizedSourceRunId === null) {
    return [];
  }

  return input.schedules.filter(
    (schedule) => normalizeRecurrenceScopeGuid(schedule.sourceRunId) === normalizedSourceRunId,
  );
}

export function buildRecurrenceArchitectureScopeLead(input: {
  readonly architectureDisplayName?: string | null;
}): string {
  const displayName = input.architectureDisplayName?.trim() ?? "";

  if (displayName.length > 0) {
    return `Recurring review of this architecture (${displayName}). Each scheduled run clones the committed source review for the same identity.`;
  }

  return "Recurring review of this architecture. Each scheduled run clones the committed source review for the same identity.";
}
