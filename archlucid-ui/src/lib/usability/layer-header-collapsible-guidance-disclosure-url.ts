import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, LAYER_HEADER_COLLAPSIBLE_GUIDANCE_OPEN_PARAM);
}
