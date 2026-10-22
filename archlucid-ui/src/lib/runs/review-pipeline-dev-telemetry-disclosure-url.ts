import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, REVIEW_PIPELINE_DEV_TELEMETRY_OPEN_PARAM);
}
