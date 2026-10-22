import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GENERATED_BY_MODEL_ALIAS_OPEN_PARAM);
}
