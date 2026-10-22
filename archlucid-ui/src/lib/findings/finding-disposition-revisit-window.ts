/** Hours after deferring a finding disposition when revisit remains available. */
export const FINDING_DISPOSITION_REVISIT_WINDOW_HOURS = 24;

export function computeFindingDispositionRevisitDueUtc(
  now: Date = new Date(),
): string {
  const revisitDue = new Date(now.getTime() + FINDING_DISPOSITION_REVISIT_WINDOW_HOURS * 60 * 60 * 1000);

  return revisitDue.toISOString();
}

export function isFindingDispositionRevisitWindowOpen(
  revisitDueUtc: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (revisitDueUtc === null || revisitDueUtc === undefined || revisitDueUtc.trim().length === 0) {
    return false;
  }

  const dueMs = Date.parse(revisitDueUtc);

  if (Number.isNaN(dueMs)) {
    return false;
  }

  return dueMs > now.getTime();
}
