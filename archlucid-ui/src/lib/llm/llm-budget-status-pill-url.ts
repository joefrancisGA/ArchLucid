import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, LLM_BUDGET_STATUS_PILL_OPEN_PARAM);
}
