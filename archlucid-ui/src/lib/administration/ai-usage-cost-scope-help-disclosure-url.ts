export const AI_USAGE_COST_SCOPE_HELP_OPEN_PARAM = "aiUsageCostScopeHelpOpen";

export function parseAiUsageCostScopeHelpOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function aiUsageCostScopeHelpDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(AI_USAGE_COST_SCOPE_HELP_OPEN_PARAM);
  } else {
    params.set(AI_USAGE_COST_SCOPE_HELP_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
