"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { useArchitectWorkspaceChrome } from "@/hooks/useArchitectWorkspaceChrome";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { extractReviewIdFromRoutePath } from "@/lib/report-problem-context";
import { isReviewDetailHeaderSearchPath } from "@/lib/review-detail-header-section-search";
import {
  buildWorkingArchitectureSearchRunIdSet,
  isWorkingArchitectureSearchPath,
  resolveWorkingSearchArchitectureIdFromPath,
} from "@/lib/search/working-architecture-search-scope";
import {
  type ReviewPackageSearchScope,
  REVIEW_PACKAGE_SEARCH_SCOPE_LABELS,
  reviewPackageSearchAriaLabel,
  reviewPackageSearchPlaceholder,
} from "@/lib/review-detail-package-search-scope";

export const WORKING_ARCHITECTURE_SEARCH_SCOPE_LABELS: Record<ReviewPackageSearchScope, string> = {
  package: "This architecture",
  workspace: "Workspace",
};

export type UseReviewPackageSearchScopeResult = {
  readonly packageScopeAvailable: boolean;
  readonly packageRunId: string | null;
  readonly architectureScopeAvailable: boolean;
  readonly architectureId: string | null;
  readonly architectureScopedRunIds: ReadonlySet<string> | null;
  readonly searchScope: ReviewPackageSearchScope;
  readonly setSearchScope: (scope: ReviewPackageSearchScope) => void;
  readonly scopeLabels: typeof REVIEW_PACKAGE_SEARCH_SCOPE_LABELS;
  readonly searchPlaceholder: string;
  readonly searchAriaLabel: string;
};

/** Working review-detail and architecture-desk search default to the open package (WA-19 / AO-32). */
export function useReviewPackageSearchScope(): UseReviewPackageSearchScopeResult {
  const pathname = usePathname() ?? "";
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();
  const reviewDetailPath = isReviewDetailHeaderSearchPath(pathname);
  const architecturePath = isWorkingArchitectureSearchPath(pathname);
  const packageScopeAvailable = architectWorkspaceChrome && reviewDetailPath;
  const architectureScopeAvailable = architectWorkspaceChrome && architecturePath;
  const architectureIdFromPath = resolveWorkingSearchArchitectureIdFromPath(pathname);
  const cachedArchitectureId = readCachedLastOpenArchitectureId();
  const architectureId = architectureIdFromPath ?? cachedArchitectureId;
  const architectureQuery = useArchitectureIdentityQuery(
    architectureId ?? "",
    architectureScopeAvailable && architectureId !== null,
  );
  const packageRunId = useMemo(() => {
    if (!packageScopeAvailable) {
      return null;
    }

    return extractReviewIdFromRoutePath(pathname);
  }, [packageScopeAvailable, pathname]);
  const architectureScopedRunIds = useMemo(() => {
    if (!architectureScopeAvailable || architectureId === null || architectureQuery.data === undefined) {
      return null;
    }

    return buildWorkingArchitectureSearchRunIdSet(architectureQuery.data.reviews);
  }, [architectureId, architectureQuery.data, architectureScopeAvailable]);
  const [searchScope, setSearchScope] = useState<ReviewPackageSearchScope>("package");
  const scopeLabels =
    architectureScopeAvailable && !packageScopeAvailable
      ? WORKING_ARCHITECTURE_SEARCH_SCOPE_LABELS
      : REVIEW_PACKAGE_SEARCH_SCOPE_LABELS;
  const effectiveScope: ReviewPackageSearchScope =
    packageScopeAvailable || architectureScopeAvailable ? searchScope : "workspace";

  return {
    packageScopeAvailable: packageScopeAvailable || architectureScopeAvailable,
    packageRunId,
    architectureScopeAvailable,
    architectureId,
    architectureScopedRunIds,
    searchScope: effectiveScope,
    setSearchScope,
    scopeLabels,
    searchPlaceholder: reviewPackageSearchPlaceholder(effectiveScope, scopeLabels),
    searchAriaLabel: reviewPackageSearchAriaLabel(effectiveScope, scopeLabels),
  };
}
