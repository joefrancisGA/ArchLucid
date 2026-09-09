export const LAYER_HEADER_COLLAPSIBLE_GUIDANCE_OPEN_PARAM = "layerHeaderCollapsibleGuidanceOpen";

export function parseLayerHeaderCollapsibleGuidanceOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function layerHeaderCollapsibleGuidanceDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(LAYER_HEADER_COLLAPSIBLE_GUIDANCE_OPEN_PARAM);
  } else {
    params.set(LAYER_HEADER_COLLAPSIBLE_GUIDANCE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
