import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_PIPELINE_TIMELINE_OPEN_PARAM = "runPipelineTimelineOpen";

export function parseRunPipelineTimelineOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runPipelineTimelineDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_PIPELINE_TIMELINE_OPEN_PARAM);
}
