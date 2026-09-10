export const HELP_GOVERNANCE_APPROVAL_TROUBLESHOOTING_ISSUE_PARAM = "helpGovernanceApprovalTroubleshootingIssue";

export function parseHelpGovernanceApprovalTroubleshootingIssueFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpGovernanceApprovalTroubleshootingDisclosureHrefFromSearch(
  currentSearch: string,
  issueSlug: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (issueSlug ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HELP_GOVERNANCE_APPROVAL_TROUBLESHOOTING_ISSUE_PARAM);
  } else {
    params.set(HELP_GOVERNANCE_APPROVAL_TROUBLESHOOTING_ISSUE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function governanceApprovalTroubleshootingIssueSlug(issue: string): string {
  return issue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
