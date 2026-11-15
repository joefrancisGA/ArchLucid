/** Prominent banner when ROI cannot compute — lists the blocking reason beside the result panel. */
export function formatSecureNowInvestigationEffortBlockingBanner(reason: string): string {
  const trimmed = reason.trim();

  if (trimmed.length === 0) {
    return "ROI blocked until all worksheet inputs are complete with positive numbers.";
  }

  return `ROI blocked until inputs are complete. ${trimmed}`;
}