import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_TROUBLESHOOTING_ISSUE_PARAM = "helpTroubleshootingIssue";

export function parseHelpTroubleshootingIssueFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpTroubleshootingIssueDisclosureHrefFromSearch(
  currentSearch: string,
  issueId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (issueId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(HELP_TROUBLESHOOTING_ISSUE_PARAM);
    } else {
      params.set(HELP_TROUBLESHOOTING_ISSUE_PARAM, trimmed);
    }
    },
  });
}
