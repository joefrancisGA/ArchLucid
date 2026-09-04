export type ReviewPackageSearchScope = "package" | "workspace";

export const REVIEW_PACKAGE_SEARCH_SCOPE_PARAM = "searchScope";

export const REVIEW_PACKAGE_SEARCH_SCOPE_LABELS: Record<ReviewPackageSearchScope, string> = {
  package: "This review",
  workspace: "Workspace",
};

export function reviewPackageSearchPlaceholder(scope: ReviewPackageSearchScope): string {
  if (scope === "package") {
    return "Search this review…";
  }

  return "Search workspace…";
}

export function reviewPackageSearchAriaLabel(scope: ReviewPackageSearchScope): string {
  if (scope === "package") {
    return "Search this review";
  }

  return "Search workspace";
}
