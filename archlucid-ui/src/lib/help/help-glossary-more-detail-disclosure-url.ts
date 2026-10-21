import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (termId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(HELP_GLOSSARY_MORE_DETAIL_TERM_PARAM);
    } else {
      params.set(HELP_GLOSSARY_MORE_DETAIL_TERM_PARAM, trimmed);
    }
    },
  });
}
