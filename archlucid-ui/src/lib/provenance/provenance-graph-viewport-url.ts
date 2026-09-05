export const PROV_GRAPH_LEGEND_OPEN_PARAM = "provGraphLegendOpen";
export const PROV_GRAPH_EXPANDED_PARAM = "provGraphExpanded";

export function parseProvGraphLegendOpenFromSearch(raw: string | null | undefined): boolean | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed === "1" || trimmed === "true";
}

export function parseProvGraphExpandedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function provenanceGraphViewportHrefFromSearch(
  currentSearch: string,
  options: {
    readonly legendOpen: boolean;
    readonly expanded: boolean;
    readonly syncLegend: boolean;
  },
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (options.syncLegend) {
    if (options.legendOpen) {
      params.delete(PROV_GRAPH_LEGEND_OPEN_PARAM);
    } else {
      params.set(PROV_GRAPH_LEGEND_OPEN_PARAM, "0");
    }
  }

  if (!options.expanded) {
    params.delete(PROV_GRAPH_EXPANDED_PARAM);
  } else {
    params.set(PROV_GRAPH_EXPANDED_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
