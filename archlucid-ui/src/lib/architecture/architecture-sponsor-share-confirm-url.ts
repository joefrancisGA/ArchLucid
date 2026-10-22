import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, confirmOpen, pathname, ARCHITECTURE_SPONSOR_SHARE_CONFIRM_PARAM);
}
