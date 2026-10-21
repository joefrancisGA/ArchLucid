import { INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH } from "@/lib/internal-ops-route-paths";
import type { PlatformBundledPolicyPackCategory } from "@/lib/platform-bundled-policy-packs-display";
import { PLATFORM_BUNDLED_POLICY_PACK_CATEGORY_OPTIONS } from "@/lib/platform-bundled-policy-packs-display";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const PLATFORM_BUNDLED_POLICY_PACKS_SEARCH_PARAM = "q";
export const PLATFORM_BUNDLED_POLICY_PACKS_CATEGORY_PARAM = "category";

const CATEGORY_IDS = new Set<string>(PLATFORM_BUNDLED_POLICY_PACK_CATEGORY_OPTIONS.map((option) => option.value));

export function parsePlatformBundledPolicyPacksSearchFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parsePlatformBundledPolicyPacksCategoryFromSearch(
  raw: string | null | undefined,
): PlatformBundledPolicyPackCategory {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!CATEGORY_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as PlatformBundledPolicyPackCategory;
}

export function platformBundledPolicyPacksSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      params.delete(PLATFORM_BUNDLED_POLICY_PACKS_SEARCH_PARAM);
    } else {
      params.set(PLATFORM_BUNDLED_POLICY_PACKS_SEARCH_PARAM, trimmed);
    }
    },
  });
}

export function platformBundledPolicyPacksCategoryHrefFromSearch(
  currentSearch: string,
  category: PlatformBundledPolicyPackCategory,
  pathname: string = INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (category === "all") {
      params.delete(PLATFORM_BUNDLED_POLICY_PACKS_CATEGORY_PARAM);
    } else {
      params.set(PLATFORM_BUNDLED_POLICY_PACKS_CATEGORY_PARAM, category);
    }
    },
  });
}
