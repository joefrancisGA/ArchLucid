import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const CLOUD_SECURITY_PREFLIGHT_OPEN_PARAM = "cloudSecurityPreflightOpen";

export function parseCloudSecurityPreflightOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function cloudSecurityPreflightDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, CLOUD_SECURITY_PREFLIGHT_OPEN_PARAM);
}
