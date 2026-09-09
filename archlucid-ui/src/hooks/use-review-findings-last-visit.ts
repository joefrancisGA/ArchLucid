"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!enabled || restoredRef.current || pathname.length === 0) {
      return;
    }

    if (reviewFindingsLastVisitHasUrlParams(searchParams)) {
      restoredRef.current = true;

      return;
    }

    const lastVisit = readReviewFindingsLastVisit(runId);
    const nextHref = buildReviewFindingsLastVisitHref(pathname, searchParams.toString(), lastVisit);

    if (`${window.location.pathname}${window.location.search}` !== nextHref) {
      router.replace(nextHref, { scroll: false });
    }

    restoredRef.current = true;
  }, [enabled, pathname, router, runId, searchParams]);
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
