import type { DigestsHubTabId } from "@/lib/digests-hub-tab";

/** Canonical Architecture digests hub path (Architecture nav group). */
export const DIGESTS_HUB_PATH = "/architecture/digests";

/** Legacy top-level path ΓÇö permanent redirect to {@link DIGESTS_HUB_PATH}. */
export const LEGACY_DIGESTS_HUB_PATH = "/digests";

/** Legacy subscriptions bookmark path used by contextual help and rewrite aliases. */
export const LEGACY_DIGEST_SUBSCRIPTIONS_PATH = "/digest-subscriptions";
/** Builds a hub tab deep link on the canonical path. */
export function digestsHubTabPath(tab: DigestsHubTabId): string {
  return `${DIGESTS_HUB_PATH}?tab=${encodeURIComponent(tab)}`;
}

/** Canonical Digests Schedule tab (traffic row DIS). */
export const DIGESTS_SCHEDULE_TAB_PATH = digestsHubTabPath("schedule");

/** Alias retained for schedule evidence copy and traffic rows. */
export const DIGESTS_SCHEDULE_CANONICAL_PATH = DIGESTS_SCHEDULE_TAB_PATH;

/** Canonical Digests Subscriptions tab (traffic row DIX). */
export const DIGESTS_SUBSCRIPTIONS_TAB_PATH = digestsHubTabPath("subscriptions");

/** Canonical Digests Browse tab (traffic row DIB). */
export const DIGESTS_BROWSE_TAB_PATH = digestsHubTabPath("browse");

/** Browse tab deep link with digest row hash anchor. */
export function digestsBrowseDigestDeepLink(digestId: string): string {
  const trimmed = digestId.trim();

  if (trimmed.length === 0) {
    return DIGESTS_BROWSE_TAB_PATH;
  }

  return `${DIGESTS_BROWSE_TAB_PATH}#digest-${encodeURIComponent(trimmed)}`;
}

/** True when `pathname` is the hub on the canonical or legacy redirect path. */
export function pathMatchesDigestsHub(pathname: string): boolean {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  return normalized === DIGESTS_HUB_PATH || normalized === LEGACY_DIGESTS_HUB_PATH;
}
