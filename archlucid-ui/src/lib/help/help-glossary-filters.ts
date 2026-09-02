import type { CustomerGlossaryCategoryId } from "@/lib/customer-glossary-manifest";

export const HELP_GLOSSARY_SEARCH_PARAM = "q";
export const HELP_GLOSSARY_CATEGORY_PARAM = "category";

export type HelpGlossaryCategoryFilter = CustomerGlossaryCategoryId | "all";

const GLOSSARY_CATEGORY_IDS = new Set<string>([
  "all",
  "review-process",
  "evidence",
  "decisions-and-findings",
  "risk-and-controls",
  "governance",
  "organization-and-access",
  "deliverables",
]);

export const HELP_GLOSSARY_PATH = "/help/glossary" as const;

export function parseHelpGlossaryCategoryFilter(raw: string | null | undefined): HelpGlossaryCategoryFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!GLOSSARY_CATEGORY_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as HelpGlossaryCategoryFilter;
}

export function parseHelpGlossarySearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function helpGlossaryCategoryHrefFromSearch(
  currentSearch: string,
  category: HelpGlossaryCategoryFilter,
  pathname: string = HELP_GLOSSARY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (category === "all") {
    params.delete(HELP_GLOSSARY_CATEGORY_PARAM);
  } else {
    params.set(HELP_GLOSSARY_CATEGORY_PARAM, category);
  }

  const query = params.toString();

  return query.length === 0 ? pathname : `${pathname}?${query}`;
}

export function helpGlossarySearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = HELP_GLOSSARY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(HELP_GLOSSARY_SEARCH_PARAM);
  } else {
    params.set(HELP_GLOSSARY_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function helpGlossaryClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = HELP_GLOSSARY_PATH,
): string {
  return helpGlossarySearchHrefFromSearch(currentSearch, "", pathname);
}
