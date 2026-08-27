import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import { fetchPagedReviewsInventory } from "@/lib/api/reviews-paged-inventory";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { fetchTenantTrialStatusCached } from "@/lib/tenant-trial-status-client";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

const DEFAULT_PROJECT_ID = "default";

/** First page size when scanning for a committed run (newest runs appear first). */
const COMMIT_SCAN_PAGE_SIZE = 40;

const FETCH_BUDGET_MS = 10_000;

export type CorePilotCommitContext = {
  /** True when tenant has at least one authority-committed manifest (trial anchor or run row). */
  hasCommittedManifest: boolean;
  /** Committed reviews visible in the first-page scan (trial anchor counts as one when present). */
  committedReviewCount: number;
  /** Newest run id on the first page, if any — useful for “open run detail” deep links. */
  latestRunId: string | null;
  /** First run on the page that already has a golden manifest, if any. */
  firstCommittedRunId: string | null;
  /** Second committed run on the page when repeat-compare prompts need a prior anchor. */
  secondCommittedRunId: string | null;
  /** Newest run has findings but no golden manifest — finalize CTA applies. */
  latestRunReadyToFinalize: boolean;
};

function isCommittedRunSummary(run: RunSummary): boolean {
  return run.hasGoldenManifest === true;
}

export const PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT: CorePilotCommitContext = {
  hasCommittedManifest: true,
  committedReviewCount: 2,
  latestRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  firstCommittedRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  secondCommittedRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  latestRunReadyToFinalize: false,
};

/** True when tenant trial status records a first commit timestamp. */
export async function fetchTrialAnchoredCommit(): Promise<boolean> {
  try {
    const payload = await fetchTenantTrialStatusCached();

    return (
      payload !== null &&
      typeof payload.firstCommitUtc === "string" &&
      payload.firstCommitUtc.length > 0
    );
  } catch {
    return false;
  }
}

/** Derives commit signals from an already-loaded run page (avoids a second runs list fetch). */
export function buildCorePilotCommitContextFromRunItems(
  items: readonly RunSummary[],
  trialAnchoredCommit: boolean,
): CorePilotCommitContext {
  const latestRun = items.length > 0 ? items[0]! : null;
  const latestRunId = latestRun?.runId ?? null;
  const latestRunReadyToFinalize =
    latestRun !== null &&
    latestRun.hasFindingsSnapshot === true &&
    latestRun.hasGoldenManifest !== true;
  const committedRuns = items.filter((r) => isCommittedRunSummary(r));
  const committed = committedRuns[0];
  const secondCommitted = committedRuns.length > 1 ? committedRuns[1] : undefined;
  const committedReviewCount = Math.max(committedRuns.length, trialAnchoredCommit ? 1 : 0);
  const hasCommittedManifest = trialAnchoredCommit || committed !== undefined;

  return {
    hasCommittedManifest,
    committedReviewCount,
    latestRunId,
    firstCommittedRunId: committed?.runId ?? null,
    secondCommittedRunId: secondCommitted?.runId ?? null,
    latestRunReadyToFinalize,
  };
}

/** Derives commit signals from an already-loaded run page (avoids a second runs list fetch). */
export async function resolveCorePilotCommitContextFromRunItems(
  items: readonly RunSummary[],
): Promise<CorePilotCommitContext> {
  if (isPublicDemoModeEnv()) {
    return PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT;
  }

  const trialAnchoredCommit = await fetchTrialAnchoredCommit();

  return buildCorePilotCommitContextFromRunItems(items, trialAnchoredCommit);
}

/**
 * Client-only: resolves Core Pilot “commit happened” signals without new API routes.
 * Prefer `GET /v1/tenant/trial-status.firstCommitUtc`; fall back to scanning run summaries.
 */
export async function fetchCorePilotCommitContext(): Promise<CorePilotCommitContext> {
  if (isPublicDemoModeEnv()) {
    return PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT;
  }

  const trialAnchoredCommit = await fetchTrialAnchoredCommit();

  try {
    const scopeHeaders =
      typeof window !== "undefined" ? getEffectiveBrowserProxyScopeHeaders() : undefined;
    const raw: unknown = await Promise.race([
      fetchPagedReviewsInventory({
        projectId: DEFAULT_PROJECT_ID,
        page: 1,
        pageSize: COMMIT_SCAN_PAGE_SIZE,
        scopeHeaders,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), FETCH_BUDGET_MS);
      }),
    ]);
    const coerced = coerceRunSummaryPaged(raw);

    if (!coerced.ok) {
      return buildCorePilotCommitContextFromRunItems([], trialAnchoredCommit);
    }

    return buildCorePilotCommitContextFromRunItems(coerced.value.items, trialAnchoredCommit);
  } catch {
    return buildCorePilotCommitContextFromRunItems([], trialAnchoredCommit);
  }
}

/** Clears cached commit-context composite reads (TB-562). */
export async function invalidateCorePilotCommitContextCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.corePilotCommitContext });
}

/** Imperative read through the shared TanStack Query cache (TB-562). */
export async function fetchCorePilotCommitContextCached(
  options?: { force?: boolean },
): Promise<CorePilotCommitContext> {
  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await invalidateCorePilotCommitContextCache();
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.corePilotCommitContext,
    queryFn: fetchCorePilotCommitContext,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}
