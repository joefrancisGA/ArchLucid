/** Proxy URL for GET /v1/architecture/review/{runId}/export/summary (markdown executive one-pager). */
export function runExecutiveSummaryExportHref(runId: string): string {
  return `/api/proxy/v1/architecture/review/${encodeURIComponent(runId)}/export/summary`;
}
