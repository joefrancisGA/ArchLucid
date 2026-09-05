export const LLM_BUDGET_STATUS_PILL_OPEN_PARAM = "llmBudgetOpen";

export function parseLlmBudgetStatusPillOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function llmBudgetStatusPillHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(LLM_BUDGET_STATUS_PILL_OPEN_PARAM);
  } else {
    params.set(LLM_BUDGET_STATUS_PILL_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
