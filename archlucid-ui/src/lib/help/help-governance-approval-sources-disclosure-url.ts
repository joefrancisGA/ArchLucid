export const HELP_GOVERNANCE_APPROVAL_SOURCES_OPEN_PARAM = "helpGovernanceApprovalSourcesOpen";

export function parseHelpGovernanceApprovalSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpGovernanceApprovalSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_GOVERNANCE_APPROVAL_SOURCES_OPEN_PARAM);
  } else {
    params.set(HELP_GOVERNANCE_APPROVAL_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
