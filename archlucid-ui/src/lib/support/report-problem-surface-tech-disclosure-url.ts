import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REPORT_PROBLEM_SURFACE_TECH_KEY_PARAM = "reportProblemSurfaceTechKey";

export function parseReportProblemSurfaceTechKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function reportProblemSurfaceTechDisclosureHrefFromSearch(
  currentSearch: string,
  surfaceId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (surfaceId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(REPORT_PROBLEM_SURFACE_TECH_KEY_PARAM);
    } else {
      params.set(REPORT_PROBLEM_SURFACE_TECH_KEY_PARAM, trimmed);
    }
    },
  });
}
