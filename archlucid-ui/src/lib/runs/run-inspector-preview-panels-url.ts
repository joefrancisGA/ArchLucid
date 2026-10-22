import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_INSPECTOR_MORE_OPEN_PARAM = "runInspectorMoreOpen";
export const RUN_INSPECTOR_TECH_OPEN_PARAM = "runInspectorTechOpen";

export type RunInspectorPreviewPanelsUrlState = {
  readonly moreOpen: boolean;
  readonly technicalOpen: boolean;
};

export function parseRunInspectorMoreOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseRunInspectorTechOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runInspectorPreviewPanelsHrefFromSearch(
  currentSearch: string,
  state: RunInspectorPreviewPanelsUrlState,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!state.moreOpen) {
      params.delete(RUN_INSPECTOR_MORE_OPEN_PARAM);
    } else {
      params.set(RUN_INSPECTOR_MORE_OPEN_PARAM, "1");
    }

    if (!state.technicalOpen) {
      params.delete(RUN_INSPECTOR_TECH_OPEN_PARAM);
    } else {
      params.set(RUN_INSPECTOR_TECH_OPEN_PARAM, "1");
    }
    },
  });
}
