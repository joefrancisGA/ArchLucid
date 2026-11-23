/** Prominent banner when ROI cannot compute — lists the blocking reason beside the result panel. */
export function formatSecureNowInvestigationEffortBlockingBanner(reason: string): string {
  const trimmed = reason.trim();

  if (trimmed.length === 0) {
    return "ROI blocked until baseline and after-product hours are entered (zero is allowed) and investigations, rate, and cost are greater than zero.";
  }

  return `ROI blocked until inputs are complete. ${trimmed}`;
}