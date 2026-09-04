import { fetchPagedReviewsInventory } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { dedupeRunSummariesByRunId, normalizeRunSummaryForDemoPicker } from "@/lib/demo-run-canonical";
import { resolveOverviewListProjectId } from "@/lib/demo-seeded-overview";
import { resolveProductionEvalChromeForServer } from "@/lib/production-desk-chrome";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { isStaticDemoPayloadFallbackEnabled, tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import type { RunSummary } from "@/types/authority";

import {
  OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE,
  type OperatorHomeRunsDashboardModel,
} from "./operator-home-runs-dashboard-model";

const DEFAULT_PROJECT_ID = "default";

/** Server loader for operator home runs dashboard first paint (TB-564). */
export async function loadOperatorHomeRunsDashboardModel(): Promise<OperatorHomeRunsDashboardModel> {
  const page = 1;
  const pageSize = OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE;
  const buyerPolishedShell = resolveProductionEvalChromeForServer();
  const { getServerResolvedScopeHeaders } = await import("@/lib/server-operator-scope");
  // Server-resolved scope only — never getEffectiveBrowserProxyScopeHeaders() on SSR (dev defaults).
  const scopeHeaders = await getServerResolvedScopeHeaders();
  const projectId = resolveOverviewListProjectId(scopeHeaders, DEFAULT_PROJECT_ID);

  let items: RunSummary[] = [];
  let totalCount = 0;
  let loadFailure: ApiLoadFailureState | null = null;
  let malformedMessage: string | null = null;
  let usedStaticRunsFallback = false;

  try {
    const raw: unknown = await fetchPagedReviewsInventory({
      projectId,
      page,
      pageSize,
      cursor: "",
      scopeHeaders,
    });
    const coerced = coerceRunSummaryPaged(raw, { page });

    if (!coerced.ok) {
      malformedMessage = coerced.message;
      items = [];
      totalCount = 0;
    } else {
      items = coerced.value.items;
      totalCount = coerced.value.totalCount;
    }
  } catch (error: unknown) {
    loadFailure = toApiLoadFailure(error);
  }

  const demoPaged =
    loadFailure !== null || malformedMessage !== null
      ? tryStaticDemoRunSummariesPaged(projectId, { afterAuthorityListFailure: true })
      : null;

  if (demoPaged !== null) {
    items = demoPaged.items;
    totalCount = demoPaged.totalCount;
    loadFailure = null;
    malformedMessage = null;
    usedStaticRunsFallback = true;
  }

  if (
    loadFailure === null &&
    malformedMessage === null &&
    items.length === 0 &&
    totalCount === 0 &&
    isStaticDemoPayloadFallbackEnabled()
  ) {
    const emptyWorkspaceDemo = tryStaticDemoRunSummariesPaged(projectId);

    if (emptyWorkspaceDemo !== null && emptyWorkspaceDemo.items.length > 0) {
      items = emptyWorkspaceDemo.items;
      totalCount = emptyWorkspaceDemo.totalCount;
      usedStaticRunsFallback = true;
    }
  }

  // TB-1039 sample-row inject is client-only (RunsDashboardPanelClient) so SSR never paints
  // a sticky fake review from DEV-default scope headers and skip-initial-fetch.

  items = dedupeRunSummariesByRunId(items.map(normalizeRunSummaryForDemoPicker));

  if (malformedMessage !== null && loadFailure === null) {
    loadFailure = uiFailureFromMessage(malformedMessage);
  }

  return {
    projectId,
    scopeQueryKeySnapshot: `${scopeHeaders["x-tenant-id"] ?? ""}:${scopeHeaders["x-workspace-id"] ?? ""}:${scopeHeaders["x-project-id"] ?? ""}`,
    page,
    pageSize,
    items,
    totalCount,
    loadFailure,
    malformedMessage,
    usedStaticRunsFallback,
    buyerPolishedShell,
  };
}
