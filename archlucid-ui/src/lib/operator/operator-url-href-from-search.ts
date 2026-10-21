import {
  applyOperatorUrlSelectionSwitch,
  type OperatorUrlSelectionSwitch,
} from "@/lib/operator/operator-url-selection-switch";

export type BuildOperatorHrefFromSearchOptions = {
  readonly selectionSwitch: OperatorUrlSelectionSwitch;
  readonly mutate: (params: URLSearchParams) => void;
};

/** Canonical operator query writer — always applies selection-switch hygiene before mutating params. */
export function buildOperatorHrefFromSearch(
  currentSearch: string,
  pathname: string,
  options: BuildOperatorHrefFromSearchOptions,
): string {
  const params = new URLSearchParams(currentSearch);

  applyOperatorUrlSelectionSwitch(params, options.selectionSwitch);
  options.mutate(params);

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

/** Boolean disclosure toggles (`?fooOpen=1`) that do not change selection scope. */
export function operatorBooleanDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
  paramName: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
      if (!open) {
        params.delete(paramName);
      } else {
        params.set(paramName, "1");
      }
    },
  });
}
