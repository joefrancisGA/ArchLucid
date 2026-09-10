import type { RunDetailFindingsFilterKind, RunDetailFindingsSortKind } from "@/components/findings/run-detail-findings-toolbar-presentation";
import { DEFAULT_FINDING_JOB_VIEW, type FindingJobView } from "@/lib/findings/finding-job-view";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import type { ReviewFindingsClassificationBandId } from "@/lib/findings/review-detail-findings-classification-band";
import { resolveReviewFindingsToolbarFilterFromSearchParam } from "@/lib/findings/review-findings-toolbar-filter-url";
import { parseReviewFindingsToolbarSearchQuery } from "@/lib/findings/review-findings-toolbar-search-url";
import { parseReviewFindingsToolbarSortFromSearch } from "@/lib/findings/review-findings-toolbar-sort-url";
import {
  parseFindingsGroundingFilterFromSearch,
  parseFindingsOriginFilterFromSearch,
} from "@/lib/findings/findings-provenance-url";
import {
  parseReviewFindingsDomainFilterFromSearch,
  parseReviewFindingsOwnerFilterFromSearch,
} from "@/lib/findings/review-findings-toolbar-field-filters-url";
import { resolveFindingJobViewFromSearchParam } from "@/lib/findings/review-findings-job-view-url";
import { parseReviewFindingsHideGenericFromSearch } from "@/lib/findings/review-findings-visibility-url";

/** Per-run last-visit toolbar state for review-detail findings (DR-13). */
export const REVIEW_FINDINGS_LAST_VISIT_STORAGE_KEY = "archlucid.reviewFindingsLastVisit.v1";

export type ReviewFindingsLastVisitV1 = {
  readonly filter: RunDetailFindingsFilterKind;
  readonly jobView: FindingJobView;
  readonly searchQuery: string;
  readonly ownerFilter: string;
  readonly domainFilter: string;
  readonly originFilter: FindingOriginFilter;
  readonly groundingFilter: FindingGroundingFilter;
  readonly sort: RunDetailFindingsSortKind;
  readonly classificationBand: ReviewFindingsClassificationBandId;
  readonly hideGenericLowDensity: boolean;
};

export type ReviewFindingsLastVisitStore = Record<string, ReviewFindingsLastVisitV1>;

const DEFAULT_LAST_VISIT: ReviewFindingsLastVisitV1 = {
  filter: "all",
  jobView: DEFAULT_FINDING_JOB_VIEW,
  searchQuery: "",
  ownerFilter: "",
  domainFilter: "",
  originFilter: "all",
  groundingFilter: "all",
  sort: "trust-then-severity",
  classificationBand: "decision-grade",
  hideGenericLowDensity: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseLastVisitEntry(value: unknown): ReviewFindingsLastVisitV1 | null {
  if (!isRecord(value)) {
    return null;
  }

  const filter = resolveReviewFindingsToolbarFilterFromSearchParam(
    typeof value.filter === "string" ? value.filter : null,
  );
  const jobView = resolveFindingJobViewFromSearchParam(typeof value.jobView === "string" ? value.jobView : null);
  const searchQuery =
    typeof value.searchQuery === "string" ? parseReviewFindingsToolbarSearchQuery(value.searchQuery) : "";
  const ownerFilter =
    typeof value.ownerFilter === "string" ? parseReviewFindingsOwnerFilterFromSearch(value.ownerFilter) : "";
  const domainFilter =
    typeof value.domainFilter === "string" ? parseReviewFindingsDomainFilterFromSearch(value.domainFilter) : "";
  const originFilter = parseFindingsOriginFilterFromSearch(
    typeof value.originFilter === "string" ? value.originFilter : null,
  );
  const groundingFilter = parseFindingsGroundingFilterFromSearch(
    typeof value.groundingFilter === "string" ? value.groundingFilter : null,
  );
  const sort = parseReviewFindingsToolbarSortFromSearch(typeof value.sort === "string" ? value.sort : null);
  const classificationBandRaw = value.classificationBand;

  let classificationBand: ReviewFindingsClassificationBandId = DEFAULT_LAST_VISIT.classificationBand;

  if (
    classificationBandRaw === "decision-grade" ||
    classificationBandRaw === "checklist" ||
    classificationBandRaw === "all"
  ) {
    classificationBand = classificationBandRaw;
  }

  const hideGenericLowDensity =
    typeof value.hideGenericLowDensity === "boolean"
      ? value.hideGenericLowDensity
      : parseReviewFindingsHideGenericFromSearch(
          typeof value.hideGenericLowDensity === "string" ? value.hideGenericLowDensity : null,
        );

  return {
    filter,
    jobView,
    searchQuery,
    ownerFilter,
    domainFilter,
    originFilter,
    groundingFilter,
    sort,
    classificationBand,
    hideGenericLowDensity,
  };
}

function readStore(): ReviewFindingsLastVisitStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(REVIEW_FINDINGS_LAST_VISIT_STORAGE_KEY);

    if (raw === null) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed)) {
      return {};
    }

    const store: ReviewFindingsLastVisitStore = {};

    for (const [runId, entry] of Object.entries(parsed)) {
      const normalized = parseLastVisitEntry(entry);

      if (normalized !== null && runId.trim().length > 0) {
        store[runId.trim()] = normalized;
      }
    }

    return store;
  } catch {
    return {};
  }
}

function writeStore(store: ReviewFindingsLastVisitStore): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(REVIEW_FINDINGS_LAST_VISIT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be unavailable
  }
}

export function readReviewFindingsLastVisit(runId: string): ReviewFindingsLastVisitV1 {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return { ...DEFAULT_LAST_VISIT };
  }

  const stored = readStore()[trimmed];

  if (stored === undefined) {
    return { ...DEFAULT_LAST_VISIT };
  }

  return stored;
}

export function patchReviewFindingsLastVisit(
  runId: string,
  partial: Partial<ReviewFindingsLastVisitV1>,
): void {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return;
  }

  const store = readStore();
  const current = store[trimmed] ?? { ...DEFAULT_LAST_VISIT };

  store[trimmed] = {
    filter: partial.filter ?? current.filter,
    jobView: partial.jobView ?? current.jobView,
    searchQuery: partial.searchQuery ?? current.searchQuery,
    ownerFilter: partial.ownerFilter ?? current.ownerFilter,
    domainFilter: partial.domainFilter ?? current.domainFilter,
    originFilter: partial.originFilter ?? current.originFilter,
    groundingFilter: partial.groundingFilter ?? current.groundingFilter,
    sort: partial.sort ?? current.sort,
    classificationBand: partial.classificationBand ?? current.classificationBand,
    hideGenericLowDensity: partial.hideGenericLowDensity ?? current.hideGenericLowDensity,
  };

  writeStore(store);
}

export function clearReviewFindingsLastVisitStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(REVIEW_FINDINGS_LAST_VISIT_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable
  }
}
