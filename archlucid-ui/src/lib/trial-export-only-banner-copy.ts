/** Headline for export-only trial phase (`daysRemaining` = days until hard purge). */
export function formatTrialExportOnlyPurgeHeadline(daysRemaining: number | null | undefined): string {
  if (typeof daysRemaining !== "number" || daysRemaining < 0) {
    return "Export-only trial phase — hard purge pending";
  }

  if (daysRemaining === 0) {
    return "Hard purge is imminent — download your data now";
  }

  if (daysRemaining === 1) {
    return "1 day until hard purge removes this workspace";
  }

  return `${daysRemaining} days until hard purge removes this workspace`;
}

export const TRIAL_EXPORT_ONLY_SUPPORTING_LINE =
  "New scans and writes are blocked. Download existing review packages and export your audit log before data is permanently deleted.";
