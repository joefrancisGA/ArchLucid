export const REVIEW_PIPELINE_DEV_TELEMETRY_OPEN_PARAM = "reviewPipelineDevTelemetryOpen";

export function parseReviewPipelineDevTelemetryOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewPipelineDevTelemetryDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(REVIEW_PIPELINE_DEV_TELEMETRY_OPEN_PARAM);
  } else {
    params.set(REVIEW_PIPELINE_DEV_TELEMETRY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
