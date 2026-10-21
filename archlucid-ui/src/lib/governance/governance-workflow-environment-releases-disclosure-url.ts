import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_OPEN_PARAM);
}
