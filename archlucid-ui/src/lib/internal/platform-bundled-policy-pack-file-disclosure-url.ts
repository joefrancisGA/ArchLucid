export const PLATFORM_BUNDLED_POLICY_PACK_FILE_KEY_PARAM = "platformBundledPolicyPackFileKey";

export function parsePlatformBundledPolicyPackFileKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function platformBundledPolicyPackFileDisclosureHrefFromSearch(
  currentSearch: string,
  bundleContentFile: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (bundleContentFile ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(PLATFORM_BUNDLED_POLICY_PACK_FILE_KEY_PARAM);
  } else {
    params.set(PLATFORM_BUNDLED_POLICY_PACK_FILE_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
