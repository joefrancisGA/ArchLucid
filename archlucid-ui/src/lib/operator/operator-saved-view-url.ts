import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const OPERATOR_SAVED_VIEW_ID_PARAM = "viewId";
export const OPERATOR_SAVED_VIEW_DELETE_CONFIRM_PARAM = "savedViewDeleteConfirm";

export function parseOperatorSavedViewIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseOperatorSavedViewDeleteConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export type OperatorSavedViewUrlState = {
  readonly viewId: string | null;
  readonly deleteConfirmOpen: boolean;
};

export function operatorSavedViewHrefFromSearch(
  currentSearch: string,
  viewId: string | null,
  pathname: string,
): string {
  return operatorSavedViewPanelsHrefFromSearch(
    currentSearch,
    { viewId, deleteConfirmOpen: false },
    pathname,
  );
}

export function operatorSavedViewPanelsHrefFromSearch(
  currentSearch: string,
  state: OperatorSavedViewUrlState,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (state.viewId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(OPERATOR_SAVED_VIEW_ID_PARAM);
    } else {
      params.set(OPERATOR_SAVED_VIEW_ID_PARAM, trimmed);
    }

    if (!state.deleteConfirmOpen) {
      params.delete(OPERATOR_SAVED_VIEW_DELETE_CONFIRM_PARAM);
    } else {
      params.set(OPERATOR_SAVED_VIEW_DELETE_CONFIRM_PARAM, "1");
    }
    },
  });
}
