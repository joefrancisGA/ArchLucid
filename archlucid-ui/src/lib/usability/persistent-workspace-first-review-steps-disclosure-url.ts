export const PERSISTENT_WORKSPACE_FIRST_REVIEW_STEPS_OPEN_PARAM = "persistentWorkspaceFirstReviewStepsOpen";

export function parsePersistentWorkspaceFirstReviewStepsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function persistentWorkspaceFirstReviewStepsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PERSISTENT_WORKSPACE_FIRST_REVIEW_STEPS_OPEN_PARAM);
  } else {
    params.set(PERSISTENT_WORKSPACE_FIRST_REVIEW_STEPS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
