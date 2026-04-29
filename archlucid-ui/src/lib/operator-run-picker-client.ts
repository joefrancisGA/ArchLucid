import { listRunsByProjectPaged } from "@/lib/api";
import {
  tryStaticDemoCompareRunSummaries,
  tryStaticDemoRunSummariesPaged,
} from "@/lib/operator-static-demo";
import type { RunSummary } from "@/types/authority";

export type LoadProjectRunsOptions = {
  /**
   * When the live list is empty (or the request failed), prefer the two-row Compare demo pair instead of the single
   * showcase run — keeps baseline/updated pickers populated in demo builds.
   */
  readonly forCompare?: boolean;
};

/**
 * Loads recent runs from the API, then merges curated demo rows when enabled and the live response is unusable.
 * Matches the server-side spine used on `/runs` so Ask, Compare, and Graph stay consistent in demo deploys.
 */
export async function loadProjectRunsMergedWithDemoFallback(
  projectId: string,
  options?: LoadProjectRunsOptions,
): Promise<{ items: RunSummary[]; loadError: boolean }> {
  let loadError = false;

  try {
    const page = await listRunsByProjectPaged(projectId, 1, 50);
    const items = page.items ?? [];

    if (items.length > 0) {
      return { items, loadError: false };
    }
  } catch {
    loadError = true;
  }

  if (options?.forCompare ?? false) {
    const compareDemo = tryStaticDemoCompareRunSummaries(projectId);

    if (compareDemo !== null) {
      return { items: compareDemo.items, loadError: false };
    }
  }

  const fallback = tryStaticDemoRunSummariesPaged(projectId);

  if (fallback !== null) {
    return { items: fallback.items, loadError: false };
  }

  return { items: [], loadError };
}
