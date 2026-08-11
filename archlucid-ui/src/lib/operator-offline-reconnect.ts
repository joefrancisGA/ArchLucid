/**
 * Architect workspace offline → reconnect banner copy and visibility (TB-2214).
 */

export const OPERATOR_OFFLINE_RECONNECT_TITLE = "Connection lost";

export const OPERATOR_OFFLINE_RECONNECT_BODY =
  "You appear to be offline. Architecture review data may be stale until the connection returns.";

export const OPERATOR_OFFLINE_RECONNECT_RETRY_LABEL = "Retry";

export type OperatorOfflineQueryClientLike = {
  // Method syntax keeps the callback bivariant so TanStack QueryClient.assignability works.
  invalidateQueries(filters?: unknown): Promise<unknown>;
};

/** Show the strip only while the browser reports offline. */
export function shouldShowOperatorOfflineReconnectBanner(isOnline: boolean): boolean {
  return isOnline !== true;
}

/** Initial online state for the architect workspace (SSR-safe default: online). */
export function readNavigatorOnline(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine !== false;
}

/**
 * Prefer TanStack Query invalidation when a client is available; otherwise full reload.
 */
export async function retryOperatorOfflineConnection(
  queryClient?: OperatorOfflineQueryClientLike | null,
): Promise<"invalidated" | "reloaded"> {
  if (queryClient != null) {
    await queryClient.invalidateQueries();

    return "invalidated";
  }

  if (typeof window !== "undefined") {
    window.location.reload();
  }

  return "reloaded";
}