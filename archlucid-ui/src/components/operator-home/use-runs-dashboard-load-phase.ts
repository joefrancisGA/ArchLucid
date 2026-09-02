"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import type { RunsDashboardLoadPhase } from "@/components/operator-home/runs-dashboard-load-phase";
import { useOptionalOperatorHomeRefresh } from "@/lib/operator/operator-home-refresh-context";
import {
  resolveRunsDashboardClientLoadMode,
  shouldSkipRunsDashboardClientFetchOnMount,
  type RunsDashboardClientLoadMode,
} from "@/lib/operator/operator-home-runs-dashboard-client-fetch";
import {
  consumeOperatorHomeRunsSnapshotStale,
  subscribeOperatorHomeLifecycleRefresh,
} from "@/lib/operator/operator-home-lifecycle-notify";
import { RUNS_DASHBOARD_PANEL_DEFAULT_PROJECT_ID } from "@/components/operator-home/runs-dashboard-panel-presentation";
import { fetchPagedReviewsInventory, restoreArchitectureRequest } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { dedupeRunSummariesByRunId, normalizeRunSummaryForDemoPicker } from "@/lib/demo-run-canonical";
import {
  buildDemoSeededOverviewRunSummary,
  resolveOverviewListProjectId,
  shouldInjectDemoSeededOverviewSample,
} from "@/lib/demo-seeded-overview";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { getOperatorScopeQueryKeySnapshot, subscribeOperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { isStaticDemoPayloadFallbackEnabled, tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import type { RunSummary } from "@/types/authority";

export type UseRunsDashboardLoadPhaseOptions = {
  readonly initialModel?: OperatorHomeRunsDashboardModel | null;
};

export function useRunsDashboardLoadPhase({
  initialModel = null,
}: UseRunsDashboardLoadPhaseOptions = {}) {
  const [items, setItems] = useState<RunSummary[]>(initialModel?.items ?? []);
  const [loadedTotalCount, setLoadedTotalCount] = useState<number>(initialModel?.totalCount ?? 0);
  const [phase, setPhase] = useState<RunsDashboardLoadPhase>(
    initialModel !== null ? (initialModel.loadFailure !== null ? "error" : "ready") : "loading",
  );
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(initialModel?.loadFailure ?? null);
  const [runsListAuthorityUnusable, setRunsListAuthorityUnusable] = useState(initialModel?.loadFailure !== null);
  const [restoreBusyRequestId, setRestoreBusyRequestId] = useState<string | null>(null);
  const itemsRef = useRef(items);

  itemsRef.current = items;

  const buyerPolishedShell = initialModel?.buyerPolishedShell ?? isBuyerPolishedOperatorShellEnv();
  const projectId =
    initialModel?.projectId ??
    resolveOverviewListProjectId(
      typeof window !== "undefined" ? getEffectiveBrowserProxyScopeHeaders() : null,
      RUNS_DASHBOARD_PANEL_DEFAULT_PROJECT_ID,
    );
  const pageSize = initialModel?.pageSize ?? OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE;
  const homeRefresh = useOptionalOperatorHomeRefresh();

  const load = useCallback(async (options?: { readonly mode?: RunsDashboardClientLoadMode }) => {
    const mode = options?.mode ?? "initial";
    const paintedItemCount = itemsRef.current.length;

    if (mode === "initial" && paintedItemCount === 0) {
      setPhase("loading");
      setFailure(null);
    }

    let nextItems: RunSummary[] = [];
    let nextTotalCount = 0;
    let nextFailure: ApiLoadFailureState | null = null;
    let authorityUnusable = false;
    let malformedMessage: string | null = null;

    try {
      const raw: unknown = await fetchPagedReviewsInventory({
        projectId,
        page: 1,
        pageSize,
        cursor: "",
        scopeHeaders: getEffectiveBrowserProxyScopeHeaders(),
      });
      const coerced = coerceRunSummaryPaged(raw, { page: 1 });

      if (!coerced.ok) {
        malformedMessage = coerced.message;
        authorityUnusable = true;
      } else {
        nextItems = coerced.value.items;
        nextTotalCount = coerced.value.totalCount;
      }
    } catch (error: unknown) {
      nextFailure = toApiLoadFailure(error);
      authorityUnusable = true;
    }

    const demoPaged =
      nextFailure !== null || malformedMessage !== null
        ? tryStaticDemoRunSummariesPaged(projectId, { afterAuthorityListFailure: true })
        : null;

    if (demoPaged !== null) {
      nextItems = demoPaged.items;
      nextTotalCount = demoPaged.totalCount;
      nextFailure = null;
      malformedMessage = null;
      authorityUnusable = false;
    }

    if (
      nextFailure === null &&
      malformedMessage === null &&
      nextItems.length === 0 &&
      isStaticDemoPayloadFallbackEnabled()
    ) {
      const emptyWorkspaceDemo = tryStaticDemoRunSummariesPaged(projectId);

      if (emptyWorkspaceDemo !== null && emptyWorkspaceDemo.items.length > 0) {
        nextItems = emptyWorkspaceDemo.items;
        nextTotalCount = emptyWorkspaceDemo.totalCount;
      }
    }

    if (
      typeof window !== "undefined" &&
      shouldInjectDemoSeededOverviewSample({
        itemCount: nextItems.length,
        scopeHeaders: getEffectiveBrowserProxyScopeHeaders(),
        workspaceLabel: readOperatorScopeFromStorage()?.workspaceLabel ?? null,
        staticDemoFallbackEnabled: isStaticDemoPayloadFallbackEnabled(),
      })
    ) {
      nextItems = [buildDemoSeededOverviewRunSummary(projectId, getEffectiveBrowserProxyScopeHeaders())];
      nextTotalCount = nextItems.length;
      nextFailure = null;
      malformedMessage = null;
      authorityUnusable = false;
    }

    nextItems = dedupeRunSummariesByRunId(nextItems.map(normalizeRunSummaryForDemoPicker));

    if (malformedMessage !== null && nextFailure === null) {
      nextFailure = uiFailureFromMessage(malformedMessage);
      authorityUnusable = true;
    }

    setItems(nextItems);
    setLoadedTotalCount(nextTotalCount);
    setFailure(nextFailure);
    setRunsListAuthorityUnusable(authorityUnusable);
    setPhase(nextFailure !== null && nextItems.length === 0 ? "error" : "ready");
  }, [pageSize, projectId]);

  const scopeQueryKeySnapshot = useSyncExternalStore(
    subscribeOperatorScopeQueryKey,
    getOperatorScopeQueryKeySnapshot,
    () => "",
  );

  const skipClientFetchOnMount = shouldSkipRunsDashboardClientFetchOnMount(
    initialModel,
    projectId,
    scopeQueryKeySnapshot,
  );

  useEffect(() => {
    const runsSnapshotStale = consumeOperatorHomeRunsSnapshotStale();

    if (skipClientFetchOnMount && !runsSnapshotStale) {
      return;
    }

    const mode = runsSnapshotStale
      ? "background"
      : resolveRunsDashboardClientLoadMode(initialModel?.items.length ?? 0);

    void load({ mode });
  }, [initialModel, load, skipClientFetchOnMount, scopeQueryKeySnapshot]);

  useEffect(() => {
    return subscribeOperatorHomeLifecycleRefresh(() => {
      void load({ mode: "background" });
    });
  }, [load]);

  useEffect(() => {
    if (homeRefresh === null) {
      return;
    }

    return homeRefresh.registerRefreshLoader(async () => {
      await load({ mode: "background" });
    });
  }, [homeRefresh, load]);

  const effectiveItems = useMemo(() => {
    if (items.length > 0) {
      return items;
    }

    if (phase !== "ready" && phase !== "error") {
      return items;
    }

    const fallback = tryStaticDemoRunSummariesPaged(projectId, {
      afterAuthorityListFailure: runsListAuthorityUnusable,
    });

    if (fallback !== null && fallback.items.length > 0) {
      return fallback.items;
    }

    if (phase === "ready" && items.length === 0 && !runsListAuthorityUnusable) {
      const emptyWorkspaceFallback = tryStaticDemoRunSummariesPaged(projectId, { afterEmptyLiveList: true });

      if (emptyWorkspaceFallback !== null && emptyWorkspaceFallback.items.length > 0) {
        return emptyWorkspaceFallback.items;
      }

      if (
        typeof window !== "undefined" &&
        shouldInjectDemoSeededOverviewSample({
          itemCount: 0,
          scopeHeaders: getEffectiveBrowserProxyScopeHeaders(),
          workspaceLabel: readOperatorScopeFromStorage()?.workspaceLabel ?? null,
          staticDemoFallbackEnabled: isStaticDemoPayloadFallbackEnabled(),
        })
      ) {
        return [buildDemoSeededOverviewRunSummary(projectId, getEffectiveBrowserProxyScopeHeaders())];
      }
    }

    return items;
  }, [items, phase, projectId, runsListAuthorityUnusable]);

  const restoreArchivedRequest = useCallback(
    async (requestId: string, onRestored?: () => void): Promise<void> => {
      setRestoreBusyRequestId(requestId);

      try {
        await restoreArchitectureRequest(requestId);
        await load({ mode: "background" });
        onRestored?.();
      } finally {
        setRestoreBusyRequestId(null);
      }
    },
    [load],
  );

  return {
    buyerPolishedShell,
    projectId,
    pageSize,
    items,
    loadedTotalCount,
    phase,
    failure,
    runsListAuthorityUnusable,
    effectiveItems,
    restoreBusyRequestId,
    load,
    restoreArchivedRequest,
  };
}
