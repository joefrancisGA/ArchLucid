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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SPONSOR_REHEARSAL_PREVIEW_OPEN_PARAM);
  } else {
    params.set(SPONSOR_REHEARSAL_PREVIEW_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
