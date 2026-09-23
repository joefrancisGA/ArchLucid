"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import type {
  RunDetailFindingsFilterKind,
  RunDetailFindingsSortKind,
} from "@/components/findings/run-detail-findings-toolbar-presentation";
import type { FindingJobView } from "@/lib/findings/finding-job-view";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import {
  buildReviewFindingsLastVisitHref,
  reviewFindingsLastVisitHasUrlParams,
} from "@/lib/findings/review-findings-last-visit-url";
import { replaceIfHrefChanged } from "@/lib/navigation/replace-if-href-changed";
import { REVIEW_DETAIL_URL_CHANGED_EVENT } from "@/lib/review-detail-workspace-tabs";
import {
  patchReviewFindingsLastVisit,
  readReviewFindingsLastVisit,
} from "@/lib/findings/review-findings-last-visit-storage";
import type { ReviewFindingsClassificationBandId } from "@/lib/findings/review-detail-findings-classification-band";

export type UseReviewFindingsLastVisitRestoreOptions = {
  readonly runId: string;
  readonly enabled: boolean;
};

/** Restores last-visit review findings filters when the URL omits them (DR-13). */
export function useReviewFindingsLastVisitRestore(options: UseReviewFindingsLastVisitRestoreOptions): void {
  const { runId, enabled } = options;
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!enabled || pathname.length === 0) {
      return;
    }

    const restoreFromLastVisitIfNeeded = (): void => {
      if (restoredRef.current) {
        return;
      }

      const windowSearchParams = new URLSearchParams(window.location.search);

      if (reviewFindingsLastVisitHasUrlParams(windowSearchParams)) {
        restoredRef.current = true;

        return;
      }

      const lastVisit = readReviewFindingsLastVisit(runId);
      const windowSearch = windowSearchParams.toString();
      const nextHref = buildReviewFindingsLastVisitHref(pathname, windowSearch, lastVisit);

      replaceIfHrefChanged(router, nextHref);
      restoredRef.current = true;
    };

    restoreFromLastVisitIfNeeded();
    window.addEventListener("popstate", restoreFromLastVisitIfNeeded);
    window.addEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, restoreFromLastVisitIfNeeded);

    return () => {
      window.removeEventListener("popstate", restoreFromLastVisitIfNeeded);
      window.removeEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, restoreFromLastVisitIfNeeded);
    };
  }, [enabled, pathname, router, runId]);
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
    hideGenericLowDensity,
  } = options;

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
      hideGenericLowDensity,
    });
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
