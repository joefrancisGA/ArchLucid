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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(GRAPH_NODE_TECHNICAL_APPENDIX_OPEN_PARAM);
  } else {
    params.set(GRAPH_NODE_TECHNICAL_APPENDIX_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
