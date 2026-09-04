export const ARCHITECTURE_SPONSOR_SHARE_CONFIRM_PARAM = "sponsorShareConfirm";

export function parseArchitectureSponsorShareConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureSponsorShareConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(ARCHITECTURE_SPONSOR_SHARE_CONFIRM_PARAM);
  } else {
    params.set(ARCHITECTURE_SPONSOR_SHARE_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
