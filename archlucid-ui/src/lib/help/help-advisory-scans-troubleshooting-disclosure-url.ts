export const HELP_ADVISORY_SCANS_TROUBLESHOOTING_ISSUE_PARAM = "helpAdvisoryScansTroubleshootingIssue";

export function parseHelpAdvisoryScansTroubleshootingIssueFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpAdvisoryScansTroubleshootingDisclosureHrefFromSearch(
  currentSearch: string,
  issueSlug: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (issueSlug ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HELP_ADVISORY_SCANS_TROUBLESHOOTING_ISSUE_PARAM);
  } else {
    params.set(HELP_ADVISORY_SCANS_TROUBLESHOOTING_ISSUE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function advisoryScansTroubleshootingIssueSlug(issue: string): string {
  return issue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
