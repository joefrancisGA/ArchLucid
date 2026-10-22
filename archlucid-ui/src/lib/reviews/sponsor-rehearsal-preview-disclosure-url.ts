import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SPONSOR_REHEARSAL_PREVIEW_OPEN_PARAM = "sponsorRehearsalPreviewOpen";

export function parseSponsorRehearsalPreviewOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function sponsorRehearsalPreviewDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SPONSOR_REHEARSAL_PREVIEW_OPEN_PARAM);
}
