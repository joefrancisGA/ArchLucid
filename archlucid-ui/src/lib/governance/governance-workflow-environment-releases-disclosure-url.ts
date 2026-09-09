export const GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_OPEN_PARAM = "governanceWorkflowEnvironmentReleasesOpen";

export function parseGovernanceWorkflowEnvironmentReleasesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function governanceWorkflowEnvironmentReleasesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_OPEN_PARAM);
  } else {
    params.set(GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
