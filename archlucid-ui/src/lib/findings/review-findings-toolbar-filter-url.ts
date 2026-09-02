import {
  FILTER_OPTIONS,
  type RunDetailFindingsFilterKind,
} from "@/components/findings/run-detail-findings-toolbar-presentation";

export const REVIEW_FINDINGS_TOOLBAR_FILTER_PARAM = "findingsFilter";

const FILTER_IDS = new Set<string>(FILTER_OPTIONS.map((option) => option.id));

export function resolveReviewFindingsToolbarFilterFromSearchParam(
  raw: string | null | undefined,
): RunDetailFindingsFilterKind {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!FILTER_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as RunDetailFindingsFilterKind;
}

export function reviewFindingsToolbarFilterHrefFromSearch(
  currentSearch: string,
  pathname: string,
  filter: RunDetailFindingsFilterKind,
): string {
  const params = new URLSearchParams(currentSearch);

  if (filter === "all") {
    params.delete(REVIEW_FINDINGS_TOOLBAR_FILTER_PARAM);
  } else {
    params.set(REVIEW_FINDINGS_TOOLBAR_FILTER_PARAM, filter);
  }

  const query = params.toString();

  return query.length === 0 ? pathname : `${pathname}?${query}`;
}

/** Persists toolbar filter in the address bar without a Next.js soft navigation. */
export function writeReviewFindingsToolbarFilterToUrl(filter: RunDetailFindingsFilterKind): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (filter === "all") {
    url.searchParams.delete(REVIEW_FINDINGS_TOOLBAR_FILTER_PARAM);
  } else {
    url.searchParams.set(REVIEW_FINDINGS_TOOLBAR_FILTER_PARAM, filter);
  }

  window.history.replaceState(null, "", url.toString());
}
