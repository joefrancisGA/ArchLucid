import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const GRAPH_NODE_TECHNICAL_APPENDIX_OPEN_PARAM = "graphNodeTechnicalAppendixOpen";

export function parseGraphNodeTechnicalAppendixOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function graphNodeTechnicalAppendixDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GRAPH_NODE_TECHNICAL_APPENDIX_OPEN_PARAM);
}
