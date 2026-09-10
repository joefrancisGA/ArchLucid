export const GENERATED_BY_MODEL_ALIAS_OPEN_PARAM = "generatedByModelAliasOpen";

export function parseGeneratedByModelAliasOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function generatedByModelAliasDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(GENERATED_BY_MODEL_ALIAS_OPEN_PARAM);
  } else {
    params.set(GENERATED_BY_MODEL_ALIAS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
