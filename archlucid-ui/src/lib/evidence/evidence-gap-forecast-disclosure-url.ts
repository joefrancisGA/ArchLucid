import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const EVIDENCE_GAP_FORECAST_OPEN_PARAM = "evidenceGapForecastOpen";

export function parseEvidenceGapForecastOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function evidenceGapForecastDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, EVIDENCE_GAP_FORECAST_OPEN_PARAM);
}
