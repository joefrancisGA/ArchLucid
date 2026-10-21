import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (issueSlug ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(HELP_GOVERNANCE_APPROVAL_TROUBLESHOOTING_ISSUE_PARAM);
    } else {
      params.set(HELP_GOVERNANCE_APPROVAL_TROUBLESHOOTING_ISSUE_PARAM, trimmed);
    }
    },
  });
}

export function governanceApprovalTroubleshootingIssueSlug(issue: string): string {
  return issue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
