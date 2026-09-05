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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PRODUCT_CONCEPTS_GLOSSARY_OPEN_PARAM);
  } else {
    params.set(PRODUCT_CONCEPTS_GLOSSARY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
