"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { useArchitectWorkspaceChrome } from "@/hooks/useArchitectWorkspaceChrome";
import { extractReviewIdFromRoutePath } from "@/lib/report-problem-context";
import { isReviewDetailHeaderSearchPath } from "@/lib/review-detail-header-section-search";
import {
  type ReviewPackageSearchScope,
  REVIEW_PACKAGE_SEARCH_SCOPE_LABELS,
  reviewPackageSearchAriaLabel,
  reviewPackageSearchPlaceholder,
} from "@/lib/review-detail-package-search-scope";

export type UseReviewPackageSearchScopeResult = {
  readonly packageScopeAvailable: boolean;
  readonly packageRunId: string | null;
  readonly searchScope: ReviewPackageSearchScope;
  readonly setSearchScope: (scope: ReviewPackageSearchScope) => void;
  readonly scopeLabels: typeof REVIEW_PACKAGE_SEARCH_SCOPE_LABELS;
  readonly searchPlaceholder: string;
  readonly searchAriaLabel: string;
};

/** Working review-detail defaults global search to the open package (WA-19). */
export function useReviewPackageSearchScope(): UseReviewPackageSearchScopeResult {
  const pathname = usePathname() ?? "";
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();
  const packageScopeAvailable =
    architectWorkspaceChrome && isReviewDetailHeaderSearchPath(pathname);
  const packageRunId = useMemo(() => {
    if (!packageScopeAvailable) {
      return null;
    }

    return extractReviewIdFromRoutePath(pathname);
  }, [packageScopeAvailable, pathname]);
  const [searchScope, setSearchScope] = useState<ReviewPackageSearchScope>("package");
  const effectiveScope: ReviewPackageSearchScope = packageScopeAvailable ? searchScope : "workspace";

  return {
    packageScopeAvailable,
    packageRunId,
    searchScope: effectiveScope,
    setSearchScope,
    scopeLabels: REVIEW_PACKAGE_SEARCH_SCOPE_LABELS,
    searchPlaceholder: reviewPackageSearchPlaceholder(effectiveScope),
    searchAriaLabel: reviewPackageSearchAriaLabel(effectiveScope),
  };
}
