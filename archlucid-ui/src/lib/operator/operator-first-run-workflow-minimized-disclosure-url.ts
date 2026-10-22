import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const OPERATOR_FIRST_RUN_WORKFLOW_MINIMIZED_OPEN_PARAM = "operatorFirstRunWorkflowMinimizedOpen";

export function parseOperatorFirstRunWorkflowMinimizedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function operatorFirstRunWorkflowMinimizedDisclosureHrefFromSearch(
  currentSearch: string,
  minimized: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, minimized, pathname, OPERATOR_FIRST_RUN_WORKFLOW_MINIMIZED_OPEN_PARAM);
}
