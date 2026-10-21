import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_ID_PICKER_OPEN_FIELD_PARAM = "runPickerField";
export const RUN_ID_PICKER_QUERY_PARAM = "runPickerQ";

export type RunIdPickerOverlayUrlState = {
  readonly open: boolean;
  readonly fieldId: string;
  readonly query: string;
};

export function parseRunIdPickerOpenFieldFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseRunIdPickerQueryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function runIdPickerOverlayHrefFromSearch(
  currentSearch: string,
  state: RunIdPickerOverlayUrlState,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const fieldId = state.fieldId.trim();
    const query = state.query.trim();

    if (!state.open || fieldId.length === 0) {
      params.delete(RUN_ID_PICKER_OPEN_FIELD_PARAM);
      params.delete(RUN_ID_PICKER_QUERY_PARAM);
    } else {
      params.set(RUN_ID_PICKER_OPEN_FIELD_PARAM, fieldId);

      if (query.length === 0) {
        params.delete(RUN_ID_PICKER_QUERY_PARAM);
      } else {
        params.set(RUN_ID_PICKER_QUERY_PARAM, query);
      }
    }
    },
  });
}
