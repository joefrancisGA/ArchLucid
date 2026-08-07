import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

export type ReplayPageServerLoadResult = { kind: "demo" } | { kind: "live" };

/**
 * Replay has no server-fetched bundle yet; this loader centralizes demo vs live branching so `page.tsx` stays async
 * and aligned with other operator routes (server decides shell, client handles URL/search-params hydration).
 */
export async function loadReplayPageData(): Promise<ReplayPageServerLoadResult> {
  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) {
    return { kind: "demo" };
  }

  return { kind: "live" };
}
