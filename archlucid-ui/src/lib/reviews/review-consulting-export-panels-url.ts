import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEW_CONSULTING_EXPORT_OPEN_PARAM = "consultingExportOpen";

export function parseReviewConsultingExportOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewConsultingExportPanelsHrefFromSearch(
  currentSearch: string,
  exportOpen: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, exportOpen, pathname, REVIEW_CONSULTING_EXPORT_OPEN_PARAM);
}
