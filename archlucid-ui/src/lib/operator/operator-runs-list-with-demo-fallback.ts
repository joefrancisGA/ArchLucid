import { isLiveOperatorShellRecoveryContext } from "@/lib/live-operator-shell-recovery";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import type { RunSummary } from "@/types/authority";

/**
 * Substitutes static demo run rows only when demo/static fallback is on — never on live tenants (LD-02).
 */
export function enrichRunsListWithStaticDemoFallback(
  items: readonly RunSummary[],
  projectId: string,
): RunSummary[] {
  if (items.length > 0) {
    return [...items];
  }

  if (isLiveOperatorShellRecoveryContext()) {
    return [];
  }

  const staticFallback = tryStaticDemoRunSummariesPaged(projectId);

  if (staticFallback === null || staticFallback.items.length === 0) {
    return [];
  }

  return staticFallback.items;
}
