import type { DigestsHubTabId } from "@/lib/digests-hub-tab";
import { DIGESTS_HUB_GET_STARTED_TAB_ID, digestsHubTabFromSearchParam } from "@/lib/digests-hub-tab";

/** Canonical Architecture digests hub path (Architecture nav group). */
export const DIGESTS_HUB_PATH = "/architecture/digests";

/** Legacy top-level path — retired bookmark; canonical is {@link DIGESTS_HUB_PATH} (orientation only). */
export const LEGACY_DIGESTS_HUB_PATH = "/digests";

/** Legacy subscriptions bookmark — retired; canonical is {@link DIGESTS_SUBSCRIPTIONS_TAB_PATH}. */
export const LEGACY_DIGEST_SUBSCRIPTIONS_PATH = "/digest-subscriptions";

/** Builds a hub tab deep link on the canonical path. */
export function digestsHubTabPath(tab: DigestsHubTabId): string {
  return `${DIGESTS_HUB_PATH}?tab=${encodeURIComponent(tab)}`;
}

/** Builds a hub deep link preserving optional review scope. */
export function digestsHubScopedHref(tab: DigestsHubTabId, runId?: string | null): string {
  const params = new URLSearchParams();
  params.set("tab", tab);
  const trimmed = (runId ?? "").trim();

  if (trimmed.length > 0) {
    params.set("runId", trimmed);
  }

  return `${DIGESTS_HUB_PATH}?${params.toString()}`;
}

/** Canonical Digests Schedule tab (traffic row ARS). */
export const DIGESTS_SCHEDULE_TAB_PATH = digestsHubTabPath("schedule");

/** Alias retained for schedule evidence copy and traffic rows. */
export const DIGESTS_SCHEDULE_CANONICAL_PATH = DIGESTS_SCHEDULE_TAB_PATH;

/** Canonical Digests Subscriptions tab (traffic row AIS). */
export const DIGESTS_SUBSCRIPTIONS_TAB_PATH = digestsHubTabPath("subscriptions");

/** Canonical Digests Get started tab (traffic row ARB). */
export const DIGESTS_GET_STARTED_TAB_PATH = digestsHubTabPath(DIGESTS_HUB_GET_STARTED_TAB_ID);

/** Alias retained for browse-tab deep links and traffic rows. */
export const DIGESTS_BROWSE_TAB_PATH = DIGESTS_GET_STARTED_TAB_PATH;

/** Browse tab deep link with digest row hash anchor. */
export function digestsBrowseDigestDeepLink(digestId: string): string {
  const trimmed = digestId.trim();

  if (trimmed.length === 0) {
    return DIGESTS_BROWSE_TAB_PATH;
  }

  return `${DIGESTS_BROWSE_TAB_PATH}#digest-${encodeURIComponent(trimmed)}`;
}

/** True when `pathname` is the hub on the canonical or legacy rewrite paths. */
export function pathMatchesDigestsHub(pathname: string): boolean {
  const normalized = normalizeDigestsHubPathname(pathname);

  return (
    normalized === DIGESTS_HUB_PATH
    || normalized === LEGACY_DIGESTS_HUB_PATH
    || normalized === LEGACY_DIGEST_SUBSCRIPTIONS_PATH
  );
}

/** Canonical hub pathname for tab navigation — upgrades legacy rewrite paths. */
export function digestsHubNavigationPathname(pathname: string): string {
  const normalized = normalizeDigestsHubPathname(pathname);

  if (normalized === LEGACY_DIGESTS_HUB_PATH || normalized === LEGACY_DIGEST_SUBSCRIPTIONS_PATH) {
    return DIGESTS_HUB_PATH;
  }

  return normalized;
}

/** Resolves the active hub tab from pathname + `?tab=` (legacy subscriptions path defaults to Subscriptions). */
export function digestsHubTabFromLocation(pathname: string, tabParam: string | null): DigestsHubTabId {
  const normalized = normalizeDigestsHubPathname(pathname);

  if (normalized === LEGACY_DIGEST_SUBSCRIPTIONS_PATH) {
    return "subscriptions";
  }

  return digestsHubTabFromSearchParam(tabParam);
}

function normalizeDigestsHubPathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}
