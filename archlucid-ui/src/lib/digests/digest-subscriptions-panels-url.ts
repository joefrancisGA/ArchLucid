import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";

export const DIGEST_SUBSCRIPTIONS_CREATE_PARAM = "create";
export const DIGEST_SUBSCRIPTIONS_HISTORY_PARAM = "history";
export const DIGEST_SUBSCRIPTIONS_PAUSE_PARAM = "pauseSubId";

export function parseDigestSubscriptionsCreatePanelFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseDigestSubscriptionsHistoryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseDigestSubscriptionsPauseIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function digestSubscriptionsPanelsHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly showCreatePanel?: boolean;
    readonly historySubscriptionId?: string | null;
    readonly pauseSubscriptionId?: string | null;
  },
  pathname: string = DIGESTS_HUB_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.showCreatePanel !== undefined) {
    if (!patch.showCreatePanel) {
      params.delete(DIGEST_SUBSCRIPTIONS_CREATE_PARAM);
    } else {
      params.set(DIGEST_SUBSCRIPTIONS_CREATE_PARAM, "1");
    }
  }

  if (patch.historySubscriptionId !== undefined) {
    const trimmed = (patch.historySubscriptionId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(DIGEST_SUBSCRIPTIONS_HISTORY_PARAM);
    } else {
      params.set(DIGEST_SUBSCRIPTIONS_HISTORY_PARAM, trimmed);
    }
  }

  if (patch.pauseSubscriptionId !== undefined) {
    const trimmed = (patch.pauseSubscriptionId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(DIGEST_SUBSCRIPTIONS_PAUSE_PARAM);
    } else {
      params.set(DIGEST_SUBSCRIPTIONS_PAUSE_PARAM, trimmed);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
