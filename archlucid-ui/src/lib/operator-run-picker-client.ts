import { listRunsByProjectPaged } from "@/lib/api";
import { filterCommittedRunsForPicker } from "@/lib/committed-run-picker";
import { normalizeRunSummaryForDemoPicker } from "@/lib/demo-run-canonical";
import { tryStaticDemoCompareRunSummaries, tryStaticDemoRunSummariesPaged } from "@/lib/operator-static-demo";
import type { RunSummary } from "@/types/authority";

export type LoadProjectRunsOptions = {
  /**
   * When the live list is empty (or the request failed), prefer the two-row Compare demo pair instead of the single
   * showcase run — keeps baseline/updated pickers populated in demo builds.
   */
  readonly forCompare?: boolean;
  /** When true, return only committed runs capped at {@link COMMITTED_RUN_PICKER_LIMIT}. */
  readonly committedOnly?: boolean;
};

function applyPickerFilters(items: RunSummary[], options?: LoadProjectRunsOptions): RunSummary[] {
  const normalized = items.map(normalizeRunSummaryForDemoPicker);

  if (options?.committedOnly ?? false) {
    return filterCommittedRunsForPicker(normalized);
  }

  return normalized;
}

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
      return { items: applyPickerFilters(items, options), loadError: false };
    }

    if (options?.forCompare ?? false) {
      const compareEmptyDemo = tryStaticDemoCompareRunSummaries(projectId);

      if (compareEmptyDemo !== null && compareEmptyDemo.items.length > 0) {
        return { items: applyPickerFilters(compareEmptyDemo.items, options), loadError: false };
      }
    }

    const emptyListDemo = tryStaticDemoRunSummariesPaged(projectId, { afterEmptyLiveList: true });

    if (emptyListDemo !== null && emptyListDemo.items.length > 0) {
      return { items: applyPickerFilters(emptyListDemo.items, options), loadError: false };
    }

    return { items: [], loadError: false };
  } catch {
    loadError = true;
  }

  if (options?.forCompare ?? false) {
    const compareDemo = tryStaticDemoCompareRunSummaries(projectId, { afterAuthorityListFailure: loadError });

    if (compareDemo !== null) {
      return { items: applyPickerFilters(compareDemo.items, options), loadError: false };
    }
  }

  const fallback = tryStaticDemoRunSummariesPaged(projectId, { afterAuthorityListFailure: loadError });

  if (fallback !== null) {
    return { items: applyPickerFilters(fallback.items, options), loadError: false };
  }

  return { items: [], loadError };
}
