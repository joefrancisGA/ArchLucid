import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FINDING_SPONSOR_PLAIN_ENGLISH_OPEN_PARAM = "findingSponsorPlainEnglishOpen";

export function parseFindingSponsorPlainEnglishOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingSponsorPlainEnglishDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FINDING_SPONSOR_PLAIN_ENGLISH_OPEN_PARAM);
}
