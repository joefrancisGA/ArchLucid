import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_CAIQ_SIG_RESPONSE_SIG_DEFERRED_OPEN_PARAM = "helpCaiqSigResponseSigDeferredOpen";

export function parseHelpCaiqSigResponseSigDeferredOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpCaiqSigResponseSigDeferredDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_CAIQ_SIG_RESPONSE_SIG_DEFERRED_OPEN_PARAM);
}
