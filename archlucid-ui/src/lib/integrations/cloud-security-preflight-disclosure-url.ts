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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(CLOUD_SECURITY_PREFLIGHT_OPEN_PARAM);
  } else {
    params.set(CLOUD_SECURITY_PREFLIGHT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
