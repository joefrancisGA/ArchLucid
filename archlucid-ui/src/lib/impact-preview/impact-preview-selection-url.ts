import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";

export const IMPACT_PREVIEW_CANDIDATE_PARAM = "candidateId";
export const IMPACT_PREVIEW_BASELINE_PARAM = "baseline";

export function parseImpactPreviewCandidateIdFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function parseImpactPreviewBaselineFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function impactPreviewCandidateHrefFromSearch(
  currentSearch: string,
  candidateId: string | null,
  pathname: string = IMPACT_PREVIEW_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (candidateId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(IMPACT_PREVIEW_CANDIDATE_PARAM);
  } else {
    params.set(IMPACT_PREVIEW_CANDIDATE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function impactPreviewBaselineHrefFromSearch(
  currentSearch: string,
  baselineRunId: string | null,
  pathname: string = IMPACT_PREVIEW_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (baselineRunId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(IMPACT_PREVIEW_BASELINE_PARAM);
  } else {
    params.set(IMPACT_PREVIEW_BASELINE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
