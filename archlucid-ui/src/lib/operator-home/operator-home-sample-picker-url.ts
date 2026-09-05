export const OPERATOR_HOME_SAMPLE_PICKER_OPEN_PARAM = "samplePickerOpen";

export function parseOperatorHomeSamplePickerOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function operatorHomeSamplePickerHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(OPERATOR_HOME_SAMPLE_PICKER_OPEN_PARAM);
  } else {
    params.set(OPERATOR_HOME_SAMPLE_PICKER_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
