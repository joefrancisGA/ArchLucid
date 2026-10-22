import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const PRODUCT_CONCEPTS_GLOSSARY_OPEN_PARAM = "productConceptsGlossaryOpen";

export function parseProductConceptsGlossaryOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function productConceptsGlossaryHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, PRODUCT_CONCEPTS_GLOSSARY_OPEN_PARAM);
}
