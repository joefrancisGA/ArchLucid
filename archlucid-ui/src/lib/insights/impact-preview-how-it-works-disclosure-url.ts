import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const IMPACT_PREVIEW_HOW_IT_WORKS_OPEN_PARAM = "impactPreviewHowItWorksOpen";

export function parseImpactPreviewHowItWorksOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function impactPreviewHowItWorksDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, IMPACT_PREVIEW_HOW_IT_WORKS_OPEN_PARAM);
}
