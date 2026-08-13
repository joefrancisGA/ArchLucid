/**
 * Query-string tab ids for the Architecture digests hub (`?tab=`). **get-started** is the default when the param is absent, empty, or unknown.
 */
export const DIGESTS_HUB_GET_STARTED_TAB_ID = "get-started" as const;

/** Retired bookmark tab id — resolves to {@link DIGESTS_HUB_GET_STARTED_TAB_ID}. */
export const LEGACY_DIGESTS_HUB_BROWSE_TAB_ID = "browse" as const;

export const DIGESTS_HUB_TAB_IDS = [
  "get-started",
  "subscriptions",
  "schedule",
] as const;
export type DigestsHubTabId = (typeof DIGESTS_HUB_TAB_IDS)[number];

const TAB_SET = new Set<string>(DIGESTS_HUB_TAB_IDS);

/**
 * Resolves the active digest hub tab from `?tab=`; unknown values fall back to **get-started**.
 * Legacy `browse` bookmarks still resolve to the Get started tab.
 */
export function digestsHubTabFromSearchParam(param: string | null): DigestsHubTabId {
  if (
    param === null
    || param === ""
    || param === LEGACY_DIGESTS_HUB_BROWSE_TAB_ID
    || param === DIGESTS_HUB_GET_STARTED_TAB_ID
  ) {
    return DIGESTS_HUB_GET_STARTED_TAB_ID;
  }

  if (TAB_SET.has(param)) {
    return param as DigestsHubTabId;
  }

  return DIGESTS_HUB_GET_STARTED_TAB_ID;
}
