import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_DETAIL_WORKSPACE_DISCLOSURES_EXPANDED_PARAM = "runDetailWorkspaceDisclosuresExpanded";

export function parseRunDetailWorkspaceDisclosuresExpandedFromSearch(raw: string | null | undefined): boolean | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed === "1" || trimmed === "true" || trimmed === "all") {
    return true;
  }

  if (trimmed === "0" || trimmed === "false" || trimmed === "none") {
    return false;
  }

  return null;
}

export function runDetailWorkspaceDisclosuresExpandedHrefFromSearch(
  currentSearch: string,
  expanded: boolean | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (expanded === null) {
      params.delete(RUN_DETAIL_WORKSPACE_DISCLOSURES_EXPANDED_PARAM);
    } else if (expanded) {
      params.set(RUN_DETAIL_WORKSPACE_DISCLOSURES_EXPANDED_PARAM, "1");
    } else {
      params.set(RUN_DETAIL_WORKSPACE_DISCLOSURES_EXPANDED_PARAM, "0");
    }
    },
  });
}
