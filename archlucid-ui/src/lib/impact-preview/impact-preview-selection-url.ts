import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (candidateId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(IMPACT_PREVIEW_CANDIDATE_PARAM);
    } else {
      params.set(IMPACT_PREVIEW_CANDIDATE_PARAM, trimmed);
    }
    },
  });
}

export function impactPreviewBaselineHrefFromSearch(
  currentSearch: string,
  baselineRunId: string | null,
  pathname: string = IMPACT_PREVIEW_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (baselineRunId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(IMPACT_PREVIEW_BASELINE_PARAM);
    } else {
      params.set(IMPACT_PREVIEW_BASELINE_PARAM, trimmed);
    }
    },
  });
}
