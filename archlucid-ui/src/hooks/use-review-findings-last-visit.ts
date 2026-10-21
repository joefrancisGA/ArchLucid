"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import type {
  RunDetailFindingsFilterKind,
  RunDetailFindingsSortKind} from "@/components/findings/run-detail-findings-toolbar-presentation";
import type { FindingJobView } from "@/lib/findings/finding-job-view";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import {
  buildReviewFindingsLastVisitHref,
  reviewFindingsLastVisitHasUrlParams} from "@/lib/findings/review-findings-last-visit-url";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import {
  patchReviewFindingsLastVisit,
  readReviewFindingsLastVisit} from "@/lib/findings/review-findings-last-visit-storage";
import type { ReviewFindingsClassificationBandId } from "@/lib/findings/review-detail-findings-classification-band";

export type UseReviewFindingsLastVisitRestoreOptions = {
  readonly runId: string;
  readonly enabled: boolean;
};

const reviewFindingsLastVisitRestoredRunIds = new Set<string>();

function findingsUrlAlreadyHasToolbarParams(pathname: string, routerSearch: string): boolean {
  const routerSearchParams = new URLSearchParams(routerSearch);

  if (reviewFindingsLastVisitHasUrlParams(routerSearchParams)) {
    return true;
  }

  if (typeof window === "undefined" || window.location.pathname !== pathname) {
    return false;
  }

  const windowSearchParams = new URLSearchParams(window.location.search);

  return reviewFindingsLastVisitHasUrlParams(windowSearchParams);
}

/** Test-only reset for module-level restore guard. */
export function resetReviewFindingsLastVisitRestoreStateForTests(): void {
  reviewFindingsLastVisitRestoredRunIds.clear();
}

/** Restores last-visit review findings filters when the URL omits them (DR-13). */
export function useReviewFindingsLastVisitRestore(options: UseReviewFindingsLastVisitRestoreOptions): void {
  const { runId, enabled } = options;
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const routerSearch = searchParams.toString();

  useEffect(() => {
    if (!enabled || pathname.length === 0 || reviewFindingsLastVisitRestoredRunIds.has(runId)) {
      return;
    }

    const restoreFromLastVisitIfNeeded = (): void => {
      if (reviewFindingsLastVisitRestoredRunIds.has(runId)) {
        return;
      }

      if (findingsUrlAlreadyHasToolbarParams(pathname, routerSearch)) {
        reviewFindingsLastVisitRestoredRunIds.add(runId);

        return;
      }

      const lastVisit = readReviewFindingsLastVisit(runId);
      const nextHref = buildReviewFindingsLastVisitHref(pathname, routerSearch, lastVisit);

      // Mark restored before notifying so the popstate listener does not re-enter this restore.
      reviewFindingsLastVisitRestoredRunIds.add(runId);
      commitHrefIfChanged(nextHref, { notify: true });
    };

    restoreFromLastVisitIfNeeded();
    window.addEventListener("popstate", restoreFromLastVisitIfNeeded);

    return () => {
      window.removeEventListener("popstate", restoreFromLastVisitIfNeeded);
      reviewFindingsLastVisitRestoredRunIds.delete(runId);
    };
  }, [enabled, pathname, routerSearch, runId]);
}

export type UseReviewFindingsLastVisitPersistOptions = {
  readonly runId: string;
  readonly enabled: boolean;
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

/** Writes review findings toolbar state to per-run last-visit storage. */
export function useReviewFindingsLastVisitPersist(options: UseReviewFindingsLastVisitPersistOptions): void {
  const {
    runId,
    enabled,
    filter,
    jobView,
    searchQuery,
    ownerFilter,
    domainFilter,
    originFilter,
    groundingFilter,
    sort,
    classificationBand,
    hideGenericLowDensity} = options;

  useEffect(() => {
    if (!enabled || runId.trim().length === 0) {
      return;
    }

    patchReviewFindingsLastVisit(runId, {
      filter,
      jobView,
      searchQuery,
      ownerFilter,
      domainFilter,
      originFilter,
      groundingFilter,
      sort,
      classificationBand,
      hideGenericLowDensity});
  }, [
    classificationBand,
    domainFilter,
    enabled,
    filter,
    groundingFilter,
    hideGenericLowDensity,
    jobView,
    originFilter,
    ownerFilter,
    runId,
    searchQuery,
    sort,
  ]);
}
