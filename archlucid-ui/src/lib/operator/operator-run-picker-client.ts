import {
  listRunsByProjectPaged,
  listRunsInScopePaged,
  shouldListReviewsAcrossProjectSlugs,
} from "@/lib/api";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { shouldMergeDemoRunsIntoProjectPicker } from "@/lib/buyer/buyer-demo-content-gating";
import { filterCommittedRunsForPicker } from "@/lib/committed-run-picker";
import { normalizeRunSummaryForDemoPicker } from "@/lib/demo-run-canonical";
import { tryStaticDemoCompareRunSummaries, tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import type { RunSummary } from "@/types/authority";
import type { PagedResponse } from "@/types/pagination";

export type LoadProjectRunsOptions = {
  /**
   * When the live list is empty (or the request failed), prefer the two-row Compare demo pair instead of the single
   * showcase run — keeps baseline/updated pickers populated in demo builds.
   */
  readonly forCompare?: boolean;
  /** When true, return only committed runs capped at {@link COMMITTED_RUN_PICKER_LIMIT}. */
  readonly committedOnly?: boolean;
  /** When false, never merge curated demo runs (tenant sponsor exports in buyer-polished shell — BDA-017). */
  readonly mergeDemoOnEmpty?: boolean;
};

function applyPickerFilters(items: RunSummary[], options?: LoadProjectRunsOptions): RunSummary[] {
  const normalized = items.map(normalizeRunSummaryForDemoPicker);

  if (options?.committedOnly ?? false) {
    return filterCommittedRunsForPicker(normalized);
  }

  return normalized;
}

/**
 * Loads recent runs for pickers. When `projectId` is omitted/`default`, lists every authority project slug in the
 * current scope (same as the Reviews hub) — create stores the system name as the run project slug, so a
 * project-only `default` query hides real finalized packages from Compare / Ask / Graph.
 */
async function fetchPickerRunsPage(projectId: string): Promise<PagedResponse<RunSummary>> {
  const page = 1;
  const pageSize = 50;

  if (!shouldListReviewsAcrossProjectSlugs(projectId)) {
    return listRunsByProjectPaged(projectId, page, pageSize);
  }

  try {
    return await listRunsInScopePaged(page, pageSize);
  } catch (error) {
    const failure = toApiLoadFailure(error);

    if (!isApiNotFoundFailure(failure)) {
      throw error;
    }

    // Older API hosts may lack GET /v1/authority/reviews — fall back to project slug list.
    return listRunsByProjectPaged(projectId, page, pageSize);
  }
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
  const mergeDemo = shouldMergeDemoRunsIntoProjectPicker(options);

  try {
    const page = await fetchPickerRunsPage(projectId);
    const items = page.items ?? [];

    if (items.length > 0) {
      return { items: applyPickerFilters(items, options), loadError: false };
    }

    if (!mergeDemo) {
      return { items: [], loadError: false };
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

  if (!mergeDemo) {
    return { items: [], loadError };
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
