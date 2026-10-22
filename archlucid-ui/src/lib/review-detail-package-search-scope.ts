export type ReviewPackageSearchScope = "package" | "workspace";

export const REVIEW_PACKAGE_SEARCH_SCOPE_PARAM = "searchScope";

export const REVIEW_PACKAGE_SEARCH_SCOPE_LABELS: Record<ReviewPackageSearchScope, string> = {
  package: "This review",
  workspace: "Workspace",
};

export function reviewPackageSearchPlaceholder(
  scope: ReviewPackageSearchScope,
  labels: Record<ReviewPackageSearchScope, string> = REVIEW_PACKAGE_SEARCH_SCOPE_LABELS,
): string {
  if (scope === "package") {
    return labels.package === "This architecture" ? "Search this architecture…" : "Search this review…";
  }

  return "Search workspace…";
}

export function reviewPackageSearchAriaLabel(
  scope: ReviewPackageSearchScope,
  labels: Record<ReviewPackageSearchScope, string> = REVIEW_PACKAGE_SEARCH_SCOPE_LABELS,
): string {
  if (scope === "package") {
    return labels.package === "This architecture" ? "Search this architecture" : "Search this review";
  }

  return "Search workspace";
}
