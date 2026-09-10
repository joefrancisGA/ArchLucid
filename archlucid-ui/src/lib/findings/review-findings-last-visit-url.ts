import type { RunDetailFindingsFilterKind, RunDetailFindingsSortKind } from "@/components/findings/run-detail-findings-toolbar-presentation";
import type { FindingJobView } from "@/lib/findings/finding-job-view";
import {
  findingsGroundingFilterHrefFromSearch,
  findingsOriginFilterHrefFromSearch,
} from "@/lib/findings/findings-provenance-url";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import type { ReviewFindingsClassificationBandId } from "@/lib/findings/review-detail-findings-classification-band";
import { reviewFindingsJobViewHrefFromSearch } from "@/lib/findings/review-findings-job-view-url";
import { reviewFindingsToolbarFilterHrefFromSearch } from "@/lib/findings/review-findings-toolbar-filter-url";
import {
  reviewFindingsDomainFilterHrefFromSearch,
  reviewFindingsOwnerFilterHrefFromSearch,
} from "@/lib/findings/review-findings-toolbar-field-filters-url";
import { reviewFindingsToolbarSearchHrefFromSearch } from "@/lib/findings/review-findings-toolbar-search-url";
import { reviewFindingsToolbarSortHrefFromSearch } from "@/lib/findings/review-findings-toolbar-sort-url";
import { reviewFindingsVisibilityHrefFromSearch } from "@/lib/findings/review-findings-visibility-url";

import type { ReviewFindingsLastVisitV1 } from "./review-findings-last-visit-storage";

export const REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM = "findingsBand";

export function parseReviewFindingsClassificationBandFromSearch(
  raw: string | null | undefined,
): ReviewFindingsClassificationBandId {
  if (raw === "checklist" || raw === "all") {
    return raw;
  }

  return "decision-grade";
}

export function reviewFindingsClassificationBandHrefFromSearch(
  currentSearch: string,
  pathname: string,
  band: ReviewFindingsClassificationBandId,
): string {
  const params = new URLSearchParams(currentSearch);

  if (band === "decision-grade") {
    params.delete(REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM);
  } else {
    params.set(REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM, band);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function buildReviewFindingsLastVisitHref(
  pathname: string,
  currentSearch: string,
  lastVisit: ReviewFindingsLastVisitV1,
): string {
  let href = reviewFindingsToolbarFilterHrefFromSearch(currentSearch, pathname, lastVisit.filter);
  const searchOnly = href.includes("?") ? href.split("?")[1] ?? "" : "";

  href = reviewFindingsJobViewHrefFromSearch(searchOnly, pathname, lastVisit.jobView);
  href = reviewFindingsToolbarSearchHrefFromSearch(
    href.includes("?") ? href.split("?")[1] ?? "" : "",
    pathname,
    lastVisit.searchQuery,
  );
  href = reviewFindingsOwnerFilterHrefFromSearch(
    href.includes("?") ? href.split("?")[1] ?? "" : "",
    pathname,
    lastVisit.ownerFilter,
  );
  href = reviewFindingsDomainFilterHrefFromSearch(
    href.includes("?") ? href.split("?")[1] ?? "" : "",
    pathname,
    lastVisit.domainFilter,
  );
  href = findingsOriginFilterHrefFromSearch(
    href.includes("?") ? href.split("?")[1] ?? "" : "",
    pathname,
    lastVisit.originFilter,
  );
  href = findingsGroundingFilterHrefFromSearch(
    href.includes("?") ? href.split("?")[1] ?? "" : "",
    pathname,
    lastVisit.groundingFilter,
  );
  href = reviewFindingsToolbarSortHrefFromSearch(
    href.includes("?") ? href.split("?")[1] ?? "" : "",
    pathname,
    lastVisit.sort,
  );
  href = reviewFindingsClassificationBandHrefFromSearch(
    href.includes("?") ? href.split("?")[1] ?? "" : "",
    pathname,
    lastVisit.classificationBand,
  );

  return reviewFindingsVisibilityHrefFromSearch(
    href.includes("?") ? href.split("?")[1] ?? "" : "",
    {
      showLowConfidence: false,
      showAdvisory: false,
      hideGenericLowDensity: lastVisit.hideGenericLowDensity,
    },
    pathname,
  );
}

export function reviewFindingsLastVisitHasUrlParams(searchParams: URLSearchParams): boolean {
  return (
    searchParams.has("findingsFilter") ||
    searchParams.has("findingJobView") ||
    searchParams.has("q") ||
    searchParams.has("owner") ||
    searchParams.has("domain") ||
    searchParams.has("origin") ||
    searchParams.has("grounding") ||
    searchParams.has("findingsSort") ||
    searchParams.has(REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM) ||
    searchParams.has("showLow") ||
    searchParams.has("showAdvisory") ||
    searchParams.has("hideGeneric")
  );
}
