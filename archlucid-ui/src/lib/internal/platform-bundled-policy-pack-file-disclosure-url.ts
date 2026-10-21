import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (bundleContentFile ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(PLATFORM_BUNDLED_POLICY_PACK_FILE_KEY_PARAM);
    } else {
      params.set(PLATFORM_BUNDLED_POLICY_PACK_FILE_KEY_PARAM, trimmed);
    }
    },
  });
}
