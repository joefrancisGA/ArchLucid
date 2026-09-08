export const HELP_GLOSSARY_MORE_DETAIL_TERM_PARAM = "helpGlossaryMoreDetailTerm";

export function parseHelpGlossaryMoreDetailTermFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpGlossaryMoreDetailDisclosureHrefFromSearch(
  currentSearch: string,
  termId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (termId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HELP_GLOSSARY_MORE_DETAIL_TERM_PARAM);
  } else {
    params.set(HELP_GLOSSARY_MORE_DETAIL_TERM_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
