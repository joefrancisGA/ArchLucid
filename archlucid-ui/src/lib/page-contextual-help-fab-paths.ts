/** Routes that show a floating contextual-help affordance in addition to header help. */
export const PAGE_CONTEXTUAL_HELP_FAB_PATH_PREFIXES: readonly string[] = [
  "/insights/compare-two-reviews",
  "/internal/validate-route",
  "/insights/evidence-graph",
  "/governance/policy-packs",
  "/insights/ask-review-questions",
  "/insights/search-review-evidence",
];

export function pathnameShowsContextualHelpFab(pathname: string): boolean {
  const normalized = pathname.split("?")[0]?.replace(/\/$/, "") || "/";

  return PAGE_CONTEXTUAL_HELP_FAB_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
