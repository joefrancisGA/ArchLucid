import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_PIPELINE_STAGES_TECHNICAL_OPEN_PARAM = "runPipelineStagesTechnicalOpen";

export function parseRunPipelineStagesTechnicalOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runPipelineStagesTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_PIPELINE_STAGES_TECHNICAL_OPEN_PARAM);
}
