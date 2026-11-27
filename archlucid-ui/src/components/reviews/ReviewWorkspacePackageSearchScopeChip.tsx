"use client";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { useReviewPackageSearchScope } from "@/hooks/use-review-package-search-scope";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewPackageSearchScope } from "@/lib/review-detail-package-search-scope";
import { REVIEW_WORKSPACE_PACKAGE_SEARCH_SCOPE_CHIP_HELPER } from "@/lib/reviews/review-workspace-package-search-scope-chip-copy";
import { cn } from "@/lib/utils";

export function ReviewWorkspacePackageSearchScopeChip(): React.JSX.Element | null {
  const packageSearchScope = useReviewPackageSearchScope();

  if (!packageSearchScope.packageScopeAvailable) {
    return null;
  }

  return (
    <div
      className="space-y-1"
      data-testid="review-workspace-package-search-scope-chip"
    >
      <FilterChipGroup
        className={cn("flex flex-wrap gap-0.5", OPERATOR_TYPOGRAPHY.helper)}
        aria-label="Search scope"
      >
        {(["package", "workspace"] as const).map((scope: ReviewPackageSearchScope) => (
          <FilterChip
            key={scope}
            aria-pressed={packageSearchScope.searchScope === scope}
            onClick={() => {
              packageSearchScope.setSearchScope(scope);
            }}
            data-testid={`review-workspace-search-scope-${scope}`}
          >
            {packageSearchScope.scopeLabels[scope]}
          </FilterChip>
        ))}
      </FilterChipGroup>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
        {REVIEW_WORKSPACE_PACKAGE_SEARCH_SCOPE_CHIP_HELPER}
      </p>
    </div>
  );
}
