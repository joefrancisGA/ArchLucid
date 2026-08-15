/** Proxy URL for GET /v1/architecture/review/{runId}/export/summary (markdown sponsor one-pager). */
export function runSponsorReportExportHref(runId: string): string {
  return `/api/proxy/v1/architecture/review/${encodeURIComponent(runId)}/export/summary`;
}
