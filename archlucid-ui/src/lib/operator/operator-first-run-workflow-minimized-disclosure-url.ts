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
  const params = new URLSearchParams(currentSearch);

  if (!minimized) {
    params.delete(OPERATOR_FIRST_RUN_WORKFLOW_MINIMIZED_OPEN_PARAM);
  } else {
    params.set(OPERATOR_FIRST_RUN_WORKFLOW_MINIMIZED_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
