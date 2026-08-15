/** Computes sponsor-facing "Day N" from the tenant's first golden manifest commit (TB-248). */
export function computePilotDayNumber(firstCommitUtc: string | null | undefined): number | null {
  const raw = firstCommitUtc?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  const committedMs = Date.parse(raw);

  if (Number.isNaN(committedMs)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - committedMs) / 86_400_000));
}
